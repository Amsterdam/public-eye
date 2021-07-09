iptables --flush
iptables --delete-chain

# default policies
iptables -P INPUT DROP
iptables -P OUTPUT ACCEPT

# allow loopback
iptables -A INPUT -i lo -j ACCEPT
iptables -A OUTPUT -i lo -j ACCEPT

# allow established connections
iptables -A INPUT -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT

# ssh
iptables -A INPUT -p tcp --dport 22 -j ACCEPT

# http
#iptables -A INPUT -p tcp --dport 80 -j ACCEPT

# https
iptables -A INPUT -p tcp --dport 443 -j ACCEPT

# rdp
iptables -A INPUT -p tcp --dport 3389 -j ACCEPT

iptables-save
