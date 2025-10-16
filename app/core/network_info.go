package core

import (
	"bufio"
	"bytes"
	"encoding/binary"
	"io"
	"net"
	"net/http"
	"os"
	"os/exec"
	"strconv"
	"strings"
	"sync"
	"time"

	psnet "github.com/shirou/gopsutil/v3/net"
)

// NetworkInfo represents the network information for the device
type NetworkInfo struct {
	IPv4Address    string         `json:"ipv4Address"`
	IPv6Address    string         `json:"ipv6Address"`
	SubnetMask     string         `json:"subnetMask"`
	Gateway        string         `json:"gateway"`
	SSID           string         `json:"ssid,omitempty"`
	EthernetInfo   EthernetInfo   `json:"ethernetInfo,omitempty"`
	DNSServers     []string       `json:"dnsServers"`
	DHCPInfo       DHCPInfo       `json:"dhcpInfo"`
	VLANInfo       VLANInfo       `json:"vlanInfo,omitempty"`
	Connection     Connection     `json:"connection"`
	Traffic        Traffic        `json:"traffic"`
	ARPEntries     []ARPEntry     `json:"arpEntries"`
	ServiceLatency ServiceLatency `json:"serviceLatency"`
	Timestamp      time.Time      `json:"timestamp"`
}

// EthernetInfo represents ethernet connection details
type EthernetInfo struct {
	InterfaceName string `json:"interfaceName"`
	MACAddress    string `json:"macAddress"`
	Speed         string `json:"speed"`
	Duplex        string `json:"duplex"`
}

// DHCPInfo represents DHCP configuration
type DHCPInfo struct {
	Enabled       bool      `json:"enabled"`
	LeaseObtained time.Time `json:"leaseObtained,omitempty"`
	LeaseExpires  time.Time `json:"leaseExpires,omitempty"`
	DHCPServer    string    `json:"dhcpServer,omitempty"`
}

// VLANInfo represents VLAN configuration if applicable
type VLANInfo struct {
	Enabled  bool   `json:"enabled"`
	VLANID   int    `json:"vlanId,omitempty"`
	Priority int    `json:"priority,omitempty"`
	Name     string `json:"name,omitempty"`
}

// Connection represents connection status and metrics
type Connection struct {
	Status         string  `json:"status"` // "connected", "disconnected", "limited"
	Uptime         int64   `json:"uptime"` // in seconds
	LatencyMS      float64 `json:"latencyMs"`
	PacketLoss     float64 `json:"packetLoss"`               // percentage
	SignalStrength int     `json:"signalStrength,omitempty"` // for wireless, in dBm
}

// Traffic represents network traffic statistics
type Traffic struct {
	BytesReceived    int64   `json:"bytesReceived"`
	BytesSent        int64   `json:"bytesSent"`
	PacketsReceived  int64   `json:"packetsReceived"`
	PacketsSent      int64   `json:"packetsSent"`
	CurrentBandwidth float64 `json:"currentBandwidth"` // in Mbps
}

// ARPEntry represents a single entry in the ARP table (IP to MAC mapping)
type ARPEntry struct {
	IPAddress  string `json:"ipAddress"`
	MACAddress string `json:"macAddress"`
	Device     string `json:"device"`
	State      string `json:"state"`
}

// ServiceLatency represents latency measurements to various major services
type ServiceLatency struct {
	Google     float64 `json:"google"`     // Google latency in ms
	Amazon     float64 `json:"amazon"`     // Amazon latency in ms
	Cloudflare float64 `json:"cloudflare"` // Cloudflare latency in ms
	Microsoft  float64 `json:"microsoft"`  // Microsoft latency in ms
	DNS        float64 `json:"dns"`        // DNS latency in ms
	HTTP       float64 `json:"http"`       // HTTP latency in ms
}

func findPrimaryInterface() (*net.Interface, *psnet.IOCountersStat, error) {
	ifaces, err := net.Interfaces()
	if err != nil {
		return nil, nil, err
	}

	counters, err := psnet.IOCounters(true)
	if err != nil {
		return nil, nil, err
	}

	counterMap := make(map[string]psnet.IOCountersStat, len(counters))
	for _, c := range counters {
		counterMap[c.Name] = c
	}

	for _, iface := range ifaces {
		if iface.Flags&net.FlagUp == 0 || iface.Flags&net.FlagLoopback != 0 {
			continue
		}

		if c, ok := counterMap[iface.Name]; ok {
			counter := c
			ifaceCopy := iface
			return &ifaceCopy, &counter, nil
		}

		ifaceCopy := iface
		return &ifaceCopy, nil, nil
	}

	return nil, nil, nil
}

func extractIPInfo(iface *net.Interface) (string, string, string) {
	if iface == nil {
		return "", "", ""
	}

	addrs, err := iface.Addrs()
	if err != nil {
		return "", "", ""
	}

	var ipv4, ipv6, subnet string
	for _, addr := range addrs {
		if ipNet, ok := addr.(*net.IPNet); ok {
			if ip := ipNet.IP.To4(); ip != nil {
				ipv4 = ip.String()
				ones, _ := ipNet.Mask.Size()
				subnet = cidrToSubnet(ones)
			} else if ipv6 == "" {
				ipv6 = ipNet.IP.String()
			}
		}
	}

	return ipv4, ipv6, subnet
}

func getConnectionMetrics(gateway string) (float64, float64) {
	targets := []string{}
	if gateway != "" && gateway != "N/A" {
		targets = append(targets, gateway)
	}
	targets = append(targets, "8.8.8.8")

	for _, target := range targets {
		latency, loss := probeConnection(target)
		if latency > 0 || loss < 100 {
			return latency, loss
		}
	}

	return 0, 100
}

func probeConnection(target string) (float64, float64) {
	const attempts = 3
	const timeout = 750 * time.Millisecond

	successes := 0
	var total float64

	for i := 0; i < attempts; i++ {
		start := time.Now()
		conn, err := net.DialTimeout("tcp", net.JoinHostPort(target, "53"), timeout)
		if err != nil {
			continue
		}

		total += float64(time.Since(start).Milliseconds())
		_ = conn.Close()
		successes++
	}

	loss := 100 * float64(attempts-successes) / float64(attempts)

	if successes == 0 {
		return 0, loss
	}

	return total / float64(successes), loss
}

func measureServiceLatencies() ServiceLatency {
	services := map[string]string{
		"google":     "google.com",
		"amazon":     "amazon.com",
		"cloudflare": "cloudflare.com",
		"microsoft":  "microsoft.com",
	}

	type result struct {
		name    string
		latency float64
	}

	results := make(chan result, len(services))
	var wg sync.WaitGroup

	for name, host := range services {
		wg.Add(1)
		go func(n, h string) {
			defer wg.Done()
			results <- result{name: n, latency: measureTCPLatency(h)}
		}(name, host)
	}

	wg.Wait()
	close(results)

	lat := ServiceLatency{}
	for res := range results {
		switch res.name {
		case "google":
			lat.Google = res.latency
		case "amazon":
			lat.Amazon = res.latency
		case "cloudflare":
			lat.Cloudflare = res.latency
		case "microsoft":
			lat.Microsoft = res.latency
		}
	}

	lat.DNS = measureDNSLookupLatency()
	lat.HTTP = measureHTTPSLatency()

	return lat
}

func measureTCPLatency(host string) float64 {
	ports := []string{"443", "80"}
	for _, port := range ports {
		start := time.Now()
		conn, err := net.DialTimeout("tcp", net.JoinHostPort(host, port), 750*time.Millisecond)
		if err != nil {
			continue
		}
		latency := float64(time.Since(start).Milliseconds())
		_ = conn.Close()
		return latency
	}
	return 0
}

func measureDNSLookupLatency() float64 {
	start := time.Now()
	_, err := net.LookupHost("www.google.com")
	if err != nil {
		return 0
	}
	return float64(time.Since(start).Milliseconds())
}

func measureHTTPSLatency() float64 {
	client := &http.Client{
		Timeout: 3 * time.Second,
	}

	urls := []string{"https://www.google.com", "https://www.cloudflare.com"}
	for _, url := range urls {
		start := time.Now()
		resp, err := client.Head(url)
		if err != nil {
			continue
		}
		io.Copy(io.Discard, resp.Body)
		resp.Body.Close()
		return float64(time.Since(start).Milliseconds())
	}

	return 0
}

// GetNetworkInfo retrieves the current network information
func GetNetworkInfo() (*NetworkInfo, error) {
	iface, counter, err := findPrimaryInterface()
	if err != nil {
		return nil, err
	}

	ipv4, ipv6, subnet := extractIPInfo(iface)

	gateway := getDefaultGateway()
	dnsServers := getDNSServers()
	dhcpServer := getDHCPServer(gateway)
	uptime := getUptime()

	latencyMS, packetLoss := getConnectionMetrics(gateway)

	traffic := Traffic{}
	if counter != nil {
		traffic = Traffic{
			BytesReceived:    int64(counter.BytesRecv),
			BytesSent:        int64(counter.BytesSent),
			PacketsReceived:  int64(counter.PacketsRecv),
			PacketsSent:      int64(counter.PacketsSent),
			CurrentBandwidth: calculateBandwidth(*counter),
		}
	}

	status := "disconnected"
	if ipv4 != "" || ipv6 != "" {
		status = "connected"
	}

	networkInfo := &NetworkInfo{
		IPv4Address: ipv4,
		IPv6Address: ipv6,
		SubnetMask:  subnet,
		Gateway:     gateway,
		DNSServers:  dnsServers,
		DHCPInfo: DHCPInfo{
			Enabled:    true,
			DHCPServer: dhcpServer,
		},
		Connection: Connection{
			Status:     status,
			Uptime:     uptime,
			LatencyMS:  latencyMS,
			PacketLoss: packetLoss,
		},
		Traffic:   traffic,
		Timestamp: time.Now(),
	}

	if iface != nil {
		networkInfo.EthernetInfo = EthernetInfo{
			InterfaceName: iface.Name,
			MACAddress:    iface.HardwareAddr.String(),
			Speed:         "1 Gbps",
			Duplex:        "Full",
		}

		if isWireless(iface.Name) {
			networkInfo.SSID = getWirelessSSID(iface.Name)
			networkInfo.Connection.SignalStrength = getSignalStrength(iface.Name)
		}

		if strings.Contains(iface.Name, ".") {
			vlanComponent := iface.Name[strings.LastIndex(iface.Name, ".")+1:]
			networkInfo.VLANInfo = VLANInfo{
				Enabled: true,
				VLANID:  getVLANID(iface.Name),
				Name:    "VLAN " + vlanComponent,
			}
		} else {
			networkInfo.VLANInfo = VLANInfo{Enabled: false}
		}
	}

	if entries, err := GetARPTable(); err == nil {
		networkInfo.ARPEntries = entries
	}

	networkInfo.ServiceLatency = measureServiceLatencies()

	return networkInfo, nil
}

// GetARPTable retrieves the current ARP table using the modern 'ip neigh show' command
// instead of the legacy 'arp -a' command
func GetARPTable() ([]ARPEntry, error) {
	// Use the modern 'ip neigh show' command
	cmd := exec.Command("ip", "neigh", "show")
	var out bytes.Buffer
	cmd.Stdout = &out
	err := cmd.Run()
	if err != nil {
		return nil, err
	}

	// Parse the output
	var entries []ARPEntry
	scanner := bufio.NewScanner(&out)
	for scanner.Scan() {
		line := scanner.Text()
		// Parse line format: 192.168.1.1 dev eth0 lladdr 00:11:22:33:44:55 REACHABLE
		fields := strings.Fields(line)

		if len(fields) < 4 {
			continue
		}

		entry := ARPEntry{
			IPAddress: fields[0],
		}

		for i := 1; i < len(fields); i++ {
			switch fields[i] {
			case "dev":
				if i+1 < len(fields) {
					entry.Device = fields[i+1]
					i++
				}
			case "lladdr":
				if i+1 < len(fields) {
					entry.MACAddress = fields[i+1]
					i++
				}
			case "REACHABLE", "STALE", "DELAY", "PERMANENT", "INCOMPLETE", "FAILED", "PROBE", "NOARP":
				entry.State = fields[i]
			}
		}

		// Only add entries that have at least IP and MAC
		if entry.IPAddress != "" && entry.MACAddress != "" {
			entries = append(entries, entry)
		}
	}

	return entries, nil
}

// Helper functions to retrieve network information
func getDefaultGateway() string {
	data, err := os.ReadFile("/proc/net/route")
	if err != nil {
		return "N/A"
	}

	lines := strings.Split(strings.TrimSpace(string(data)), "\n")
	if len(lines) <= 1 {
		return "N/A"
	}

	for _, line := range lines[1:] {
		fields := strings.Fields(line)
		if len(fields) < 3 {
			continue
		}

		// Destination column equals 0 for default route
		if fields[1] != "00000000" {
			continue
		}

		value, err := strconv.ParseUint(fields[2], 16, 32)
		if err != nil {
			continue
		}

		b := make([]byte, 4)
		binary.LittleEndian.PutUint32(b, uint32(value))
		ip := net.IP(b)
		if ip.Equal(net.IPv4zero) {
			continue
		}

		return ip.String()
	}

	return "N/A"
}

func getDNSServers() []string {
	data, err := os.ReadFile("/etc/resolv.conf")
	if err != nil {
		return []string{"N/A"}
	}

	var servers []string
	scanner := bufio.NewScanner(bytes.NewReader(data))
	for scanner.Scan() {
		line := scanner.Text()
		if strings.HasPrefix(line, "nameserver") {
			fields := strings.Fields(line)
			if len(fields) >= 2 {
				servers = append(servers, fields[1])
			}
		}
	}

	if len(servers) == 0 {
		return []string{"N/A"}
	}
	return servers
}

func getDHCPServer(defaultGateway string) string {
	if defaultGateway != "" && defaultGateway != "N/A" {
		return defaultGateway
	}
	return "N/A"
}

func getUptime() int64 {
	data, err := os.ReadFile("/proc/uptime")
	if err != nil {
		return 0
	}

	fields := strings.Fields(string(data))
	if len(fields) == 0 {
		return 0
	}

	uptimeFloat, err := strconv.ParseFloat(fields[0], 64)
	if err != nil {
		return 0
	}

	return int64(uptimeFloat)
}

func isWireless(ifaceName string) bool {
	// Check if interface is wireless by checking if it appears in iwconfig output
	cmd := exec.Command("iwconfig", ifaceName)
	var out bytes.Buffer
	cmd.Stdout = &out
	cmd.Stderr = &out
	err := cmd.Run()
	if err == nil && !strings.Contains(out.String(), "no wireless extensions") {
		return true
	}

	// Fallback to naming convention if iwconfig is not available
	return strings.HasPrefix(ifaceName, "wlan") || strings.HasPrefix(ifaceName, "wlp")
}

func getWirelessSSID(ifaceName string) string {
	if !isWireless(ifaceName) {
		return ""
	}

	// Try using iwconfig
	cmd := exec.Command("iwconfig", ifaceName)
	var out bytes.Buffer
	cmd.Stdout = &out
	err := cmd.Run()
	if err != nil {
		return ""
	}

	// Parse the SSID from the output
	output := out.String()
	essidIndex := strings.Index(output, "ESSID:")
	if essidIndex == -1 {
		return ""
	}

	// Extract the SSID value between quotes
	essidPart := output[essidIndex+7:]
	endQuoteIndex := strings.Index(essidPart, "\"")
	if endQuoteIndex == -1 {
		return ""
	}

	return essidPart[:endQuoteIndex]
}

func getSignalStrength(ifaceName string) int {
	if !isWireless(ifaceName) {
		return 0
	}

	// Try using iwconfig to get signal strength
	cmd := exec.Command("iwconfig", ifaceName)
	var out bytes.Buffer
	cmd.Stdout = &out
	err := cmd.Run()
	if err != nil {
		return 0
	}

	// Parse the signal level from the output
	output := out.String()
	signalIndex := strings.Index(output, "Signal level=")
	if signalIndex == -1 {
		return 0
	}

	// Extract the signal level value
	signalPart := output[signalIndex+13:]
	endIndex := strings.Index(signalPart, " ")
	if endIndex == -1 {
		return 0
	}

	// Remove dBm suffix if present
	signalStr := strings.TrimSuffix(signalPart[:endIndex], "dBm")
	signalInt, err := strconv.Atoi(signalStr)
	if err != nil {
		return 0
	}

	return signalInt
}

func getVLANID(ifaceName string) int {
	// Extract VLAN ID from interface name (e.g., eth0.10 -> 10)
	if idx := strings.LastIndex(ifaceName, "."); idx != -1 {
		vlanStr := ifaceName[idx+1:]
		vlanID, err := strconv.Atoi(vlanStr)
		if err == nil {
			return vlanID
		}
	}

	// Try reading from sysfs
	cmd := exec.Command("cat", "/proc/net/vlan/"+ifaceName)
	var out bytes.Buffer
	cmd.Stdout = &out
	err := cmd.Run()
	if err == nil {
		output := out.String()
		vlanIDIndex := strings.Index(output, "VID: ")
		if vlanIDIndex != -1 {
			vlanStr := strings.TrimSpace(output[vlanIDIndex+5:])
			endIndex := strings.Index(vlanStr, " ")
			if endIndex != -1 {
				vlanStr = vlanStr[:endIndex]
			}
			vlanID, err := strconv.Atoi(vlanStr)
			if err == nil {
				return vlanID
			}
		}
	}

	return 0
}

// Stores the last measured network counter values for bandwidth calculation
var (
	bandwidthMu         sync.Mutex
	lastMeasurementTime time.Time
	lastBytesRecv       uint64
	lastBytesSent       uint64
	currentBandwidth    float64
)

func calculateBandwidth(counter psnet.IOCountersStat) float64 {
	bandwidthMu.Lock()
	defer bandwidthMu.Unlock()

	now := time.Now()

	// Initialize on first call
	if lastMeasurementTime.IsZero() {
		lastMeasurementTime = now
		lastBytesRecv = counter.BytesRecv
		lastBytesSent = counter.BytesSent
		return 0 // No history for calculation yet
	}

	// Calculate time difference in seconds
	timeDiffSecs := now.Sub(lastMeasurementTime).Seconds()

	// Avoid division by zero or negative time
	if timeDiffSecs <= 0 {
		return currentBandwidth // Return last known bandwidth
	}

	// Calculate bytes transferred since last measurement
	bytesDiff := (counter.BytesRecv - lastBytesRecv) + (counter.BytesSent - lastBytesSent)

	// Calculate bandwidth in Megabits per second (1 Byte = 8 bits)
	// bytes/second * 8 / 1024 / 1024 = Mbps
	bandwidth := float64(bytesDiff) * 8 / 1024 / 1024 / timeDiffSecs

	// Update last values for next calculation
	lastMeasurementTime = now
	lastBytesRecv = counter.BytesRecv
	lastBytesSent = counter.BytesSent
	currentBandwidth = bandwidth

	return bandwidth
}

func cidrToSubnet(ones int) string {
	if ones < 0 || ones > 32 {
		return "255.255.255.0"
	}
	mask := net.CIDRMask(ones, 32)
	ip := net.IP(mask)
	return ip.String()
}
