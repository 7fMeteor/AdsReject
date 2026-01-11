/***
 * Clash Meta 扩展脚本
 * Author: Waster
 * Github：https://github.com/7fMeteor/AdsReject
 */

// 资源配置中心：统一管理远程资源根路径
const ASSETS = {
  // 远程图标仓库基地址
  icons: "https://raw.githubusercontent.com/7fMeteor/AdsReject/main/icons",
  // 规则集源路径配置
  rules: {
    // 广告拦截规则集
    ads: "https://raw.githubusercontent.com/7fMeteor/AdsReject/main/clash-ads-reject.yaml",
    // Loyalsoldier 规则仓库
    loyal: "https://fastly.jsdelivr.net/gh/Loyalsoldier/clash-rules@release",
    // MetaCubeX 规则仓库
    meta: "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/classical"
  }
};

// 工厂函数：构建标准化规则集提供者
// 默认 behavior 为 "domain"
const createRuleProvider = (url, path, behavior = "domain", format = "yaml", interval = 86400) => ({
  "type": "http",
  "format": format,
  "interval": interval,
  "behavior": behavior,
  "url": url,
  "path": path
});

// 本地保留网段列表：用于直连与路由环路规避 (CIDR)
const skipIps = [
  '127.0.0.0/8',      // IPv4 Loopback (回环地址)
  '10.0.0.0/8',       // LAN Class A (局域网)
  '100.64.0.0/10',    // Carrier-Grade NAT (运营商保留)
  '169.254.0.0/16',   // Link-Local (链路本地)
  '172.16.0.0/12',    // LAN Class B (局域网)
  '192.0.0.0/24',     // IETF Protocol Reserved (协议保留)
  '192.168.0.0/16',   // LAN Class C (局域网)
  '224.0.0.0/4',      // Multicast (组播/投屏)
  'FC00::/7',         // IPv6 Unique Local (唯一本地)
  'FE80::/10',        // IPv6 Link-Local (链路本地)
  '::1/128',          // IPv6 Loopback (回环地址)
];

// 国内 DNS 服务器列表 (DoH)
// 策略：阿里(稳定) + 腾讯(覆盖广) + 字节(速度快)
const domesticNameservers = [
  "https://dns.alidns.com/dns-query", // 阿里DoH
  "https://doh.pub/dns-query",        // 腾讯DoH
  "https://180.184.1.1/dns-query"     // 字节跳动DoH，目前仅支持IPv4
];

// 国外 DNS 服务器列表 (DoH)
const foreignNameservers = [
  "https://cloudflare-dns.com/dns-query", // CloudflareDNS
  "https://common.dot.dns.yandex.net/dns-query", // YandexDNS
  "https://dns.google/dns-query#ecs=1.1.1.1/24&ecs-override=true", // GoogleDNS (强制开启ECS)
  "https://doh.opendns.com/dns-query#ecs=1.1.1.1/24&ecs-override=true", // OpenDNS (强制开启ECS)
  "https://dns.quad9.net/dns-query", // Quad9DNS
];

// Meta 内核 DNS 全局配置
const dnsConfig = {
  "enable": true,
  "listen": "0.0.0.0:1053",
  // "ipv6": true, // 根据本地网络环境决定是否开启
  "prefer-h3": true, // 开启 HTTP/3 支持，加速查询
  "respect-rules": true,
  "use-system-hosts": true, // 读取系统 Hosts
  "cache-algorithm": "arc",
  "enhanced-mode": "fake-ip",
  "fake-ip-range": "198.18.0.1/16",
  "fake-ip-filter": [
    // 本地主机与设备
    "+.lan",
    "+.local",
    // Windows 连接性检测
    "+.msftconnecttest.com",
    "+.msftncsi.com",
    // 腾讯系本地进程
    "localhost.ptlogin2.qq.com",
    "localhost.sec.qq.com",
    "localhost.work.weixin.qq.com",
    // 游戏 NAT 与 P2P 相关
    "+.stun.*",
    "+.steamcontent.com",
    "+.xboxlive.com",
    // NTP 时间同步 (防止时间不同步导致证书错误)
    "+.pool.ntp.org",
    "+.ntp.org",
    "+.time.*.com",
    "+.time.*.gov",
    // 路由器后台管理
    "router.asus.com",
    "*.routerlogin.net",
    "*.tplinkwifi.net",
    // 兼容性优化补充
    "connect.rom.miui.com", // 小米连接检测
    "*.msftconnecttest.com", // Windows 连接检测
    "time.apple.com" // 苹果对时
  ],
  // Bootstrap DNS 使用国内高可用 IP (用于解析 DoH 域名)
  "default-nameserver": [
    "223.5.5.5",        // 阿里 DNS (主)
    "223.6.6.6",        // 阿里 DNS (备)
    "119.29.29.29",     // 腾讯 DNS
    "114.114.114.114",  // 114 DNS (高可用保底)
    "180.76.76.76",     // 百度 DNS（不推荐，仅做保底）
    "1.2.4.8"           // CNNIC DNS（不推荐，仅做保底）
  ],
  "nameserver": [
    ...foreignNameservers
  ],
  "proxy-server-nameserver": [
    ...domesticNameservers
  ],
  "direct-nameserver": [
    ...domesticNameservers
  ],
  "direct-nameserver-follow-policy": false,
  "nameserver-policy": {
    "geosite:cn": domesticNameservers,
    "geosite:private": domesticNameservers,
    "geosite:google": foreignNameservers,
    "geosite:youtube": foreignNameservers,
    "geosite:telegram": foreignNameservers,
    "geosite:gfw": foreignNameservers,
    "geosite:geolocation-!cn": foreignNameservers
  },
  // 兜底过滤，防止国外域名被解析到国内保留 IP (DNS污染特征)
  "fallback-filter": {
    "geoip": true,
    "geoip-code": "CN",
    "ipcidr": [
      "240.0.0.0/4",
      "0.0.0.0/32" // 常见污染 IP
    ]
  }
};

// 地区识别规则与图标路径定义
const regionDefinitions = [
  {
    name: 'HK香港',
    regex: /港|🇭🇰|hongkong|hong kong|(?:^|[^a-z])hk(?:[^a-z]|$)/i,
    icon: `${ASSETS.icons}/flags/hk.svg`
  },
  {
    name: 'US美国',
    regex: /(?!.*aus)(?=.*(美|🇺🇸|usa|american|united states|(?:^|[^a-z])us(?:(?!t)|[^a-z]|$))).*/i,
    icon: `${ASSETS.icons}/flags/us.svg`
  },
  {
    name: 'JP日本',
    regex: /日本|🇯🇵|japan|(?:^|[^a-z])jp(?:[^a-z]|$)/i,
    icon: `${ASSETS.icons}/flags/jp.svg`
  },
  {
    name: 'SG新加坡',
    regex: /新加坡|🇸🇬|singapore|(?:^|[^a-z])sg(?:[^a-z]|$)/i,
    icon: `${ASSETS.icons}/flags/sg.svg`
  },
  {
    name: 'TW台湾',
    regex: /台湾|🇹🇼|taiwan|tai wan|(?:^|[^a-z])tw(?:[^a-z]|$)/i,
    icon: `${ASSETS.icons}/flags/tw.svg`
  },
  {
    name: 'KR韩国',
    regex: /韩|🇰🇷|korea|(?:^|[^a-z])kr(?:[^a-z]|$)/i,
    icon: `${ASSETS.icons}/flags/kr.svg`
  },
  {
    name: 'DE德国',
    regex: /德国|🇩🇪|germany|(?:^|[^a-z])de(?:[^a-z]|$)/i,
    icon: `${ASSETS.icons}/flags/de.svg`
  },
  {
    name: 'GB英国',
    regex: /英|🇬🇧|united kingdom|great britain|(?:^|[^a-z])uk(?:[^a-z]|$)/i,
    icon: `${ASSETS.icons}/flags/gb.svg`
  },
  {
    name: 'FR法国',
    regex: /法|🇫🇷|france|(?:^|[^a-z])fr(?:[^a-z]|$)/i,
    icon: `${ASSETS.icons}/flags/fr.svg`
  },
  {
    name: 'CA加拿大',
    regex: /加|🇨🇦|canada|(?:^|[^a-z])ca(?:[^a-z]|$)/i,
    icon: `${ASSETS.icons}/flags/ca.svg`
  },
  {
    name: 'AU澳洲',
    regex: /澳|🇦🇺|australia|(?:^|[^a-z])au(?:[^a-z]|$)/i,
    icon: `${ASSETS.icons}/flags/au.svg`
  },
  {
    name: 'NL荷兰',
    regex: /荷|🇳🇱|netherlands|(?:^|[^a-z])nl(?:[^a-z]|$)/i,
    icon: `${ASSETS.icons}/flags/nl.svg`
  },
  {
    name: 'RU俄罗斯',
    regex: /俄|🇷🇺|russia|(?:^|[^a-z])ru(?:[^a-z]|$)/i,
    icon: `${ASSETS.icons}/flags/ru.svg`
  },
  {
    name: 'IN印度',
    regex: /印|🇮🇳|india|(?:^|[^a-z])in(?:[^a-z]|$)/i,
    icon: `${ASSETS.icons}/flags/in.svg`
  },
];

// 自定义直连域名列表
const DirectDomains = [
  "apphot.cc",   // 烈火资源站
  "wycad.com"    // 无忧软件网
];


// 规则集配置 (Rule Providers)
const ruleProviders = {
  // 广告拦截
  // 内容为纯网址列表 (如 - 'xycdn.com')，无前缀，必须用 domain
  "reject": createRuleProvider(ASSETS.rules.ads, "./ruleset/loyalsoldier/reject.yaml"),

  // Loyalsoldier 基础规则
  // 内容为纯网址列表 (如 - '+.0.myikas.com')，无前缀，必须用 domain
  "icloud": createRuleProvider(`${ASSETS.rules.loyal}/icloud.txt`, "./ruleset/loyalsoldier/icloud.yaml"),
  "apple": createRuleProvider(`${ASSETS.rules.loyal}/apple.txt`, "./ruleset/loyalsoldier/apple.yaml"),
  "google": createRuleProvider(`${ASSETS.rules.loyal}/google.txt`, "./ruleset/loyalsoldier/google.yaml"),
  "proxy": createRuleProvider(`${ASSETS.rules.loyal}/proxy.txt`, "./ruleset/loyalsoldier/proxy.yaml"),
  "direct": createRuleProvider(`${ASSETS.rules.loyal}/direct.txt`, "./ruleset/loyalsoldier/direct.yaml"),
  "private": createRuleProvider(`${ASSETS.rules.loyal}/private.txt`, "./ruleset/loyalsoldier/private.yaml"),
  "gfw": createRuleProvider(`${ASSETS.rules.loyal}/gfw.txt`, "./ruleset/loyalsoldier/gfw.yaml"),
  "tld-not-cn": createRuleProvider(`${ASSETS.rules.loyal}/tld-not-cn.txt`, "./ruleset/loyalsoldier/tld-not-cn.yaml"),

  // IP段规则 (CIDR)
  // 内容为纯 IP 字符串 (如 - '10.0.0.0/8')，无前缀，必须用 ipcidr
  "telegramcidr": createRuleProvider(`${ASSETS.rules.loyal}/telegramcidr.txt`, "./ruleset/loyalsoldier/telegramcidr.yaml", "ipcidr"),
  "cncidr": createRuleProvider(`${ASSETS.rules.loyal}/cncidr.txt`, "./ruleset/loyalsoldier/cncidr.yaml", "ipcidr"),
  "lancidr": createRuleProvider(`${ASSETS.rules.loyal}/lancidr.txt`, "./ruleset/loyalsoldier/lancidr.yaml", "ipcidr"),

  // 经典行为规则 (Loyalsoldier)
  // 内容含规则类型前缀，必须用 classical
  "applications": createRuleProvider(`${ASSETS.rules.loyal}/applications.txt`, "./ruleset/loyalsoldier/applications.yaml", "classical"),

  // MetaCubeX 规则集 (Meta 格式)
  // 内容含 DOMAIN-SUFFIX 等前缀，必须用 classical
  "bilibili": createRuleProvider(`${ASSETS.rules.meta}/bilibili.yaml`, "./ruleset/MetaCubeX/bilibili.yaml", "classical"),
  "openai": createRuleProvider(`${ASSETS.rules.meta}/openai.yaml`, "./ruleset/MetaCubeX/openai.yaml", "classical"),
  "bybit": createRuleProvider(`${ASSETS.rules.meta}/bybit.yaml`, "./ruleset/MetaCubeX/bybit.yaml", "classical"),
  "pikpak": createRuleProvider(`${ASSETS.rules.meta}/pikpak.yaml`, "./ruleset/MetaCubeX/pikpak.yaml", "classical"),
  "anthropic": createRuleProvider(`${ASSETS.rules.meta}/anthropic.yaml`, "./ruleset/MetaCubeX/anthropic.yaml", "classical"),
  "google-gemini": createRuleProvider(`${ASSETS.rules.meta}/google-gemini.yaml`, "./ruleset/MetaCubeX/google-gemini.yaml", "classical"),
  "xai": createRuleProvider(`${ASSETS.rules.meta}/xai.yaml`, "./ruleset/MetaCubeX/xai.yaml", "classical"),
  "perplexity": createRuleProvider(`${ASSETS.rules.meta}/perplexity.yaml`, "./ruleset/MetaCubeX/perplexity.yaml", "classical"),
  "microsoft": createRuleProvider(`${ASSETS.rules.meta}/microsoft.yaml`, "./ruleset/MetaCubeX/microsoft.yaml", "classical"),
};

// 静态分流规则列表 (按优先级排序)
const rules = [
  // 动态生成自定义直连规则
  ...DirectDomains.map(domain => `DOMAIN-SUFFIX,${domain},DIRECT`),
  // 远程控制、组网软件、VPN等强制直连
  "PROCESS-NAME-REGEX,(?i).*Oray.*,DIRECT", // 向日葵
  "PROCESS-NAME-REGEX,(?i).*Sunlogin.*,DIRECT", // 向日葵
  "PROCESS-NAME-REGEX,(?i).*AweSun.*,DIRECT", // 向日葵旗下
  "PROCESS-NAME-REGEX,(?i).*ToDesk.*,DIRECT", // ToDesk
  "PROCESS-NAME-REGEX,(?i).*TeamViewer.*,DIRECT", // TeamViewer
  "PROCESS-NAME-REGEX,(?i).*AnyDesk.*,DIRECT", // AnyDesk
  "PROCESS-NAME-REGEX,(?i).*Zerotier.*,DIRECT", // ZeroTier 组网
  "PROCESS-NAME-REGEX,(?i).*Tailscaled.*,DIRECT", // Tailscale 组网
  "PROCESS-NAME-REGEX,(?i).*frpc.*,DIRECT", // FRP 内网穿透
  "PROCESS-NAME-REGEX,(?i).*frps.*,DIRECT",
  "PROCESS-NAME-REGEX,(?i).*ngrok.*,DIRECT", // Ngrok
  "PROCESS-NAME-REGEX,(?i).*vpn.*,DIRECT", // 各类 VPN 客户端防止回环

  // 自定义直连/代理
  // Steam
  "PROCESS-NAME-REGEX,(?i)^steam,🐬 自定义直连",
  // 喜马拉雅
  "PROCESS-NAME-REGEX,(?i)^喜马拉雅,🐬 自定义直连",
  // 哔哩哔哩安卓端
  "PROCESS-NAME,tv.danmaku.bili,📺 哔哩哔哩",
  // 沉浸式翻译插件
  "DOMAIN-SUFFIX,immersivetranslate.com,🐳 自定义代理",
  // Bing 搜索引擎 (按需开启)
  // "DOMAIN-SUFFIX,bing.com,🐳 自定义代理",

  // 谷歌服务优化
  "DOMAIN-SUFFIX,googleapis.cn,🔰 模式选择",
  "DOMAIN-SUFFIX,gstatic.com,🔰 模式选择",
  "DOMAIN-SUFFIX,xn--ngstr-lra8j.com,🔰 模式选择", // Google Play下载
  "DOMAIN-SUFFIX,github.io,🔰 模式选择",
  "DOMAIN,v2rayse.com,🔰 模式选择",

  // GitHub 强制走代理，因为 GitHub 已被微软收购，会影响微软服务分流
  "GEOSITE,github,🔰 模式选择",

  // 广告过滤，提高优先级
  "RULE-SET,reject,🥰 广告过滤",

  // AI 服务
  "RULE-SET,openai,💸 Ai",
  "RULE-SET,google-gemini,💸 Ai",
  "RULE-SET,xai,💸 Ai",
  "RULE-SET,perplexity,💸 Ai",
  "RULE-SET,anthropic,💸 Ai",

  // 哔哩哔哩
  "RULE-SET,bilibili,📺 哔哩哔哩",

  // 特定应用
  "RULE-SET,pikpak,🅿️ PikPak",
  "RULE-SET,bybit,🪙 Bybit",
  // ⚠️注意！微软服务包含 GitHub
  "RULE-SET,microsoft,Ⓜ️ 微软服务",
  "RULE-SET,icloud,🍎 苹果服务",
  "RULE-SET,apple,🍎 苹果服务",
  "RULE-SET,google,📢 谷歌服务",

  // 基础分类
  "RULE-SET,applications,🔗 全局直连",
  "RULE-SET,private,🔗 全局直连",
  "RULE-SET,proxy,🔰 模式选择",
  "RULE-SET,gfw,🔰 模式选择",
  "RULE-SET,tld-not-cn,🔰 模式选择",
  "RULE-SET,telegramcidr,📲 电报消息,no-resolve", // 放在靠后位置避免误杀

  // 兜底策略
  "RULE-SET,direct,🔗 全局直连",
  "RULE-SET,lancidr,🔗 全局直连,no-resolve",
  "RULE-SET,cncidr,🔗 全局直连,no-resolve",
  "GEOIP,LAN,🔗 全局直连,no-resolve",
  "GEOIP,CN,🔗 全局直连,no-resolve",
  "MATCH,🐟 漏网之鱼"
];

// 落地节点 (Landing Node) 手动配置列表
// ⚠️ 注意：如果没有落地节点，请保持数组为空
const landingNodeProxies = [
  {
    "name": "webshare", // 给你的落地节点起个名字
    "server": "", // 替换成你的落地节点 IP 或域名 (必填)
    "port": 12345, // 替换成你的落地节点端口
    "type": "socks5",
    "username": "", // 替换成你的用户名
    "password": "", // 替换成你的密码
    "tls": false,
    "skip-cert-verify": true,
    "udp": true,
    "dialer-proxy": "⚙️ 节点选择"
  },
  // 如果有更多落地节点，在这里继续添加
  // {
  //   "name": "landing-node-2",
  //   ...
  //   "dialer-proxy": "⚙️ 节点选择"
  // }
];

// 脚本主执行入口
function main(config) {
  // 配置完整性校验
  if (!config) return config;

  // 备份原始代理节点
  const originalProxies = config?.proxies ? [...config.proxies] : [];

  // 备份原始代理提供者
  const originalProviders = config?.["proxy-providers"] || {};

  // 全局内核参数调优
  config["unified-delay"] = true; // 真实延迟
  config["tcp-concurrent"] = true; // TCP 并发
  
  // 开启 TLS 指纹模拟 (Chrome) 以伪装流量特征
  config["global-client-fingerprint"] = "chrome";

  // Geodata 数据加载与自动更新配置
  config['geodata-mode'] = true; // 强制使用 .dat 文件
  config['geo-auto-update'] = true; // 开启 Geo 自动更新
  config['geo-update-interval'] = 24; // Geo 更新间隔 (小时)

  config["profile"] = {
    "store-selected": true,
    "store-fake-ip": true
  };

  // 进程匹配与内存优化
  config['find-process-mode'] = 'strict';
  config['geodata-loader'] = 'memconservative';
  config['keep-alive-interval'] = 1800;

  // NTP 时间同步配置
  config['ntp'] = {
  enable: true,
  'write-to-system': false,
  'dialer-proxy': "🔗 全局直连", // 明确指定直连，防止通过代理同步时间导致回环
  server: 'ntp.aliyun.com',
  };

  // TUN 模式 DNS 劫持配置
  if (!config['tun']) config['tun'] = {};
  config['tun']['dns-hijack'] = ['any:53', 'tcp://any:53'];
  config['tun']['route-exclude-address'] = skipIps;

  // 流量嗅探配置 (Sniffer)
  config['sniffer'] = {
    enable: true,
    'force-dns-mapping': true,
    'parse-pure-ip': false, // 不嗅探纯 IP 连接，自动过滤掉大部分 P2P/BT 流量
    'override-destination': true,
    sniff: {
      TLS: {
        ports: [443, 8443],
      },
      HTTP: {
        ports: [80, '8080-8880'],
      },
      QUIC: {
        ports: [443, 8443],
      },
    },
    'skip-src-address': skipIps,
    'skip-dst-address': skipIps,
    'force-domain': [
      '+.google.com',
      '+.googleapis.com',
      '+.googleusercontent.com',
      '+.youtube.com',
      '+.facebook.com',
      '+.messenger.com',
      '+.fbcdn.net',
      'fbcdn-a.akamaihd.net',
    ],
    // 强制跳过嗅探的域名/关键词 (Skip Domain)
    'skip-domain': [
      // ⚠️ Google 服务：当 Google Home/Nest 等智能设备无法连接时，可以取消掉注释
      // '+.google.com',

      // 国内服务与智能家居
      'Mijia Cloud',
      '+.oray.com',
      '+.push.apple.com',
      '+.apple.com', // 保护 AppStore 和 iCloud 下载
      '+.localhost',
      '*.local',
      '+.msftconnecttest.com',
      '+.msftncsi.com',
      '+.qq.com',
      '+.music.163.com',
      '+.datarouter.cn', // 小米系统服务

      // 游戏平台 (防止 NAT 类型严格导致联机失败)
      '+.steamcontent.com', // Steam 下载 CDN
      'xbox.*.microsoft.com', // Xbox 联机
      '+.battlenet.com.cn', // 暴雪战网
      '+.game.rpg.qq.com', // 腾讯游戏
      '+.nintendo.net', // 🆕 Switch 联机
      '+.stun.playstation.net', // 🆕 PlayStation 联机探测
      '+.sonyentertainmentnetwork.com', // 🆕 PSN 服务

      // P2P 下载 (节省性能)
      '+.tracker.3211000.com', // 常见 BT Tracker
      '+.bittorrent.com'
    ],
  };

  // 注入核心配置
  config["dns"] = dnsConfig;
  config["rule-providers"] = ruleProviders;
  config["rules"] = rules;

  // 代理节点处理：过滤无效节点并强制开启 UDP
  const processedProxies = originalProxies.map(proxy => {
    if (proxy && typeof proxy === 'object' && proxy.name && proxy.server) {
      proxy.udp = true;
    } else {
      return null;
    }
    return proxy;
  }).filter(p => p !== null);

  // 辅助函数：识别并过滤高倍率节点 (>3.0x)
  const checkHighMultiplier = (name) => {
    if (!name) return false;
    const regex = /(?:x|X|倍|倍率)\s*((?:0\.\d+|[1-9]\d*(?:\.\d+)?))/;
    const match = name.match(regex);
    return match && parseFloat(match[1]) > 3.0;
  };

  // 初始化地区分组容器
  const regionGroups = {};

  // 初始化预定义地区
  regionDefinitions.forEach(r => regionGroups[r.name] = { ...r, proxies: [] });

  // 初始化其它地区
  const otherRegionName = '🏁 其它地区';
  regionGroups[otherRegionName] = { name: otherRegionName, proxies: [], icon: `${ASSETS.icons}/flags/un.svg` };

  // 节点归类逻辑
  processedProxies.forEach(proxy => {
    if (checkHighMultiplier(proxy.name)) return;

    let matched = false;
    for (const region of regionDefinitions) {
      if (region.regex.test(proxy.name)) {
        regionGroups[region.name].proxies.push(proxy.name);
        matched = true;
        break;
      }
    }
    if (!matched) {
      regionGroups[otherRegionName].proxies.push(proxy.name);
    }
  });

  // 策略组通用配置 (测速与超时)
  const groupBaseOption = {
    "interval": 600,
    "timeout": 3000,
    "url": "https://www.gstatic.com/generate_204",
    "lazy": true,
    "max-failed-times": 3,
    "hidden": false
  };

  // 生成地区策略组 (嵌套逻辑：Select -> Auto)
  const generatedRegionGroups = [];
  
  Object.values(regionGroups).filter(r => r.proxies.length > 0).forEach(r => {
      // 创建该地区的自动测速组
      const autoGroupName = `⚡ 自动选择 ${r.name}`;
      generatedRegionGroups.push({
          ...groupBaseOption,
          "name": autoGroupName,
          "type": "url-test",
          "tolerance": 50,
          "proxies": r.proxies,
          "hidden": true
      });
  
      // 创建该地区的对外展示组 (Select，允许手动或自动)
      generatedRegionGroups.push({
          ...groupBaseOption, // 保持基本配置
          "name": r.name,
          "type": "select",
          "proxies": [autoGroupName, ...r.proxies],
          "icon": r.icon
      });
  });

  // 提取地区组名称 (仅提取暴露给用户的 Select 组)
  const regionGroupNames = generatedRegionGroups
    .filter(g => g.type === "select")
    .map(g => g.name);

  // 提取配置中有效的落地节点
  const validLandingNodes = landingNodeProxies.filter(p => p.server && p.server !== "");

  // 更新全局代理列表
  config["proxies"] = [
    ...processedProxies,
    ...validLandingNodes
  ];

  // 提取落地节点名称
  const landingNodeNames = validLandingNodes.map(p => p.name);

  // 构建落地节点排除正则
  const escapeForRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const excludeLandingFilter = landingNodeNames.length > 0
    ? `^(?:${landingNodeNames.map(escapeForRegExp).join('|')})$`
    : null;

  // 定义需要动态排除落地节点的策略组名单
  // 这些组会自动合并原有的排除规则和落地节点排除规则
  const groupsToExcludeLandingNodes = [
    "⚙️ 节点选择",
    "♻️ 延迟选优",
    "🚑 故障转移",
    "⚖️ 负载均衡(散列)",
    "☁️ 负载均衡(轮询)"
  ];

  // 通用代理列表 (默认：代理优先)
  // 适用：Google, Telegram, ChatGPT, GitHub 等被墙服务
  const commonProxies = [
    "🔰 模式选择",
    "🌍 地区选择",
    "⚙️ 节点选择",
    "🕊️ 落地节点",
    "♻️ 延迟选优",
    "🚑 故障转移",
    "🔗 全局直连"
  ];

  // 直连优先列表 (默认：直连优先)
  // 适用：Bilibili, Apple, Microsoft 等国内有 CDN 但偶尔需代理的服务
  const directFirstProxies = [
    "🔗 全局直连",
    "🔰 模式选择",
    "🌍 地区选择",
    "⚙️ 节点选择",
    "♻️ 延迟选优",
    "🚑 故障转移"
  ];

  // 策略组定义
  const groupDefinitions = [
    // 核心管理组 - 不包含具体节点，只做策略选择
    {
      name: "🔰 模式选择",
      type: "select",
      proxies: [
        "⚙️ 节点选择",
        "🌍 地区选择",
        "🕊️ 落地节点",
        "🔗 全局直连"
      ],
      icon: `${ASSETS.icons}/cloudflare.svg`,
      includeAll: false
    },
    // 节点选择组
    {
      name: "⚙️ 节点选择",
      type: "select",
      proxies: [
        "♻️ 延迟选优",
        "🌍 地区选择",
        "🚑 故障转移",
        "⚖️ 负载均衡(散列)",
        "☁️ 负载均衡(轮询)"
      ],
      icon: `${ASSETS.icons}/adjust.svg`,
      includeAll: true
    },
    // 地区选择入口
    {
      name: "🌍 地区选择",
      type: "select",
      proxies: [
        "♻️ 延迟选优",
        ...regionGroupNames
      ],
      condition: regionGroupNames.length > 0,
      icon: `${ASSETS.icons}/global.svg`,
      includeAll: false
    },
    // 落地节点入口
    {
      name: "🕊️ 落地节点",
      type: "select",
      proxies: landingNodeNames.length > 0 ? landingNodeNames : [
        "⚙️ 节点选择",
        "🔗 全局直连"
      ],
      icon: `${ASSETS.icons}/openwrt.svg`,
      includeAll: false
    },

    // 自动选优与负载均衡
    {
      name: "♻️ 延迟选优",
      type: "url-test",
      tolerance: 50,
      icon: `${ASSETS.icons}/speed.svg`,
      includeAll: true
    },
    {
      name: "🚑 故障转移",
      type: "fallback",
      icon: `${ASSETS.icons}/ambulance.svg`,
      includeAll: true
    },
    {
      name: "⚖️ 负载均衡(散列)",
      type: "load-balance",
      strategy: "consistent-hashing",
      icon: `${ASSETS.icons}/merry_go.svg`,
      includeAll: true
    },
    {
      name: "☁️ 负载均衡(轮询)",
      type: "load-balance",
      strategy: "round-robin",
      icon: `${ASSETS.icons}/balance.svg`,
      includeAll: true
    },

    // 业务策略组
    {
      name: "📺 哔哩哔哩",
      type: "select",
      proxies: directFirstProxies,
      icon: `${ASSETS.icons}/bilibili.svg`,
      includeAll: true
    },
    {
      name: "🌍 国外媒体",
      type: "select",
      proxies: [
        ...commonProxies,
        "🚑 故障转移"
      ],
      icon: `${ASSETS.icons}/youtube.svg`,
      includeAll: true
    },
    {
      name: "💸 Ai",
      type: "select",
      proxies: commonProxies,
      exclude: "(?i)(^|[^a-z])(港|hk|hongkong|澳|macao|俄|ru|russia|cn|china)([^a-z]|$)",
      icon: `${ASSETS.icons}/chatgpt.svg`,
      includeAll: true
    },

    // 特定应用组
    {
      name: "🪙 Bybit",
      type: "select",
      proxies: commonProxies,
      icon: `${ASSETS.icons}/bybit.svg`,
      includeAll: true
    },
    {
      name: "🅿️ PikPak",
      type: "select",
      proxies: commonProxies,
      icon: `${ASSETS.icons}/pikpak.svg`,
      includeAll: true
    },
    {
      name: "📲 电报消息",
      type: "select",
      proxies: commonProxies,
      icon: `${ASSETS.icons}/telegram.svg`,
      includeAll: true
    },
    {
      name: "📢 谷歌服务",
      type: "select",
      proxies: commonProxies,
      icon: `${ASSETS.icons}/google.svg`,
      includeAll: true
    },
    {
      name: "🍎 苹果服务",
      type: "select",
      proxies: directFirstProxies,
      icon: `${ASSETS.icons}/apple.svg`,
      includeAll: true
    },
    {
      name: "Ⓜ️ 微软服务",
      type: "select",
      proxies: directFirstProxies,
      icon: `${ASSETS.icons}/microsoft.svg`,
      includeAll: true
    },

    // 拦截、直连、代理
    {
      name: "🥰 广告过滤",
      type: "select",
      proxies: [
        "REJECT",
        "DIRECT"
      ],
      icon: `${ASSETS.icons}/bug.svg`,
      includeAll: false
    },
    {
      name: "🔗 全局直连",
      type: "select",
      proxies: [
        "DIRECT",
        "⚙️ 节点选择",
        "🌍 地区选择",
        "♻️ 延迟选优"
      ],
      icon: `${ASSETS.icons}/link.svg`,
      includeAll: false
    },
    {
      name: "❌ 全局拦截",
      type: "select",
      proxies: [
        "REJECT",
        "DIRECT"
      ],
      icon: `${ASSETS.icons}/block.svg`,
      includeAll: false
    },
    {
      name: "🐬 自定义直连",
      type: "select",
      proxies: directFirstProxies,
      icon: `${ASSETS.icons}/unknown.svg`,
      includeAll: true
    },
    {
      name: "🐳 自定义代理",
      type: "select",
      proxies: commonProxies,
      icon: `${ASSETS.icons}/openwrt.svg`,
      includeAll: true
    },
    {
      name: "🐟 漏网之鱼",
      type: "select",
      proxies: commonProxies,
      icon: `${ASSETS.icons}/fish.svg`,
      includeAll: true
    }
  ];

  // 构建最终策略组 (引入动态正则合并逻辑)
  const finalProxyGroups = groupDefinitions
    .filter(g => g.condition !== false)
    .map(g => {
      // 确保 proxies 始终为数组
      const currentProxies = g.proxies || [];
      const group = {
        ...groupBaseOption,
        name: g.name,
        type: g.type,
        proxies: currentProxies,
        icon: g.icon
      };
      if (g.strategy) group.strategy = g.strategy;

      // 动态逻辑：判断当前组是否需要排除落地节点
      const shouldAppendLandingExclude = groupsToExcludeLandingNodes.includes(g.name) && excludeLandingFilter;
      
      // 获取当前组已有的排除规则 (例如 AI 组的地区排除)
      const currentExclude = g.exclude || "";

      // 智能合并排除规则
      // 如果需要排除落地节点，则将其追加到现有规则中 (使用 | 运算符)
      let finalFilter = currentExclude;
      if (shouldAppendLandingExclude) {
        finalFilter = currentExclude 
          ? `(${currentExclude})|(${excludeLandingFilter})` 
          : excludeLandingFilter;
      }

      // 仅当最终规则有效时写入配置
      if (finalFilter && finalFilter !== "") {
        group["exclude-filter"] = finalFilter;
      }

      // 仅当显式指定为 true 时开启 include-all
      if (g.includeAll === true) {
        group["include-all"] = true;
      }

      return group;
    });

  // 合并所有策略组
  config["proxy-groups"] = [
    ...finalProxyGroups,
    ...generatedRegionGroups
  ];

  // 合并外部代理提供者
  config["proxy-providers"] = {
    ...originalProviders,
    // 示例订阅
    /* "p1": {
      "type": "http",   // 订阅链接
      "url": "https://google.com", // ⚠️ 请替换此处 URL
      "interval": 86400,
      "proxy": "🔰 模式选择",
      "override": { 
        "additional-prefix": "p1 |"
      }
    }
    */
  };

  // 返回最终配置
  return config;
}
