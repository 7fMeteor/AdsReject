/***
 * Clash Meta 扩展脚本
 * Author: Waster
 * Github：https://github.com/7fMeteor/AdsReject
 */

// 全局辅助函数：创建规则提供者
const createRuleProvider = (url, path, behavior = "domain", format = "yaml", interval = 86400) => ({
  "type": "http",
  "format": format,
  "interval": interval,
  "behavior": behavior,
  "url": url,
  "path": path
});

const skipIps = [
  '10.0.0.0/8',
  '100.64.0.0/10',
  '169.254.0.0/16',
  '172.16.0.0/12',
  '192.0.0.0/24',
  '192.168.0.0/16',
  '198.18.0.0/15',
  'FC00::/7',
  'FE80::/10',
  '::1/128',
];

// 图标
const iconBase = "https://raw.githubusercontent.com/clash-verge-rev/clash-verge-rev.github.io/main/docs/assets/icons";

// 国内DNS服务器
// 策略：阿里(稳定) + 腾讯(覆盖广) + 字节(速度快)
const domesticNameservers = [
  "https://dns.alidns.com/dns-query", // 阿里DoH
  "https://doh.pub/dns-query", // 腾讯DoH
  "https://180.184.1.1/dns-query" // 字节跳动DoH，目前仅支持IPv4
];

// 国外DNS服务器
const foreignNameservers = [
  "https://cloudflare-dns.com/dns-query", // CloudflareDNS
  "https://common.dot.dns.yandex.net/dns-query", // YandexDNS
  "https://dns.google/dns-query#ecs=1.1.1.1/24&ecs-override=true", // GoogleDNS (强制开启ECS)
  "https://doh.opendns.com/dns-query#ecs=1.1.1.1/24&ecs-override=true", // OpenDNS (强制开启ECS)
  "https://dns.quad9.net/dns-query", // Quad9DNS
];

// DNS配置
const dnsConfig = {
  "enable": true,
  "listen": "0.0.0.0:1053",
  // "ipv6": true, // 根据本地网络环境决定是否开启
  "prefer-h3": true, // 开启 HTTP/3 支持，可能加速 DoH 查询
  "respect-rules": true,
  "use-system-hosts": true, // 开启读取系统 hosts
  "cache-algorithm": "arc",
  "enhanced-mode": "fake-ip",
  "fake-ip-range": "198.18.0.1/16",
  "fake-ip-filter": [
    // 本地主机/设备
    "+.lan",
    "+.local",
    // Windows网络出现小地球图标
    "+.msftconnecttest.com",
    "+.msftncsi.com",
    // QQ/微信快速登录检测
    "localhost.ptlogin2.qq.com",
    "localhost.sec.qq.com",
    "localhost.work.weixin.qq.com",
    // 游戏平台与 P2P 相关 (防止 NAT 类型严格)
    "+.stun.*", 
    "+.steamcontent.com", 
    "+.xboxlive.com",
    // NTP 服务
    "+.pool.ntp.org", 
    "+.ntp.org"
  ],
  "default-nameserver": ["223.5.5.5", "119.29.29.29", "180.76.76.76", "1.2.4.8"], // Bootstrap DNS 使用国内高可用 IP
  "nameserver": [...foreignNameservers],
  "proxy-server-nameserver": [...domesticNameservers],
  "direct-nameserver": [...domesticNameservers],
  "direct-nameserver-follow-policy": false,
  "nameserver-policy": {
    "geosite:cn,private": domesticNameservers,
    "geosite:google,youtube,telegram,gfw,geolocation-!cn": foreignNameservers
  }
};

// 地区定义 (用于自动分组)
const regionDefinitions = [
  { name: 'HK香港', regex: /港|🇭🇰|hk|hongkong|hong kong/i, icon: `${iconBase}/flags/hk.svg` },
  { name: 'US美国', regex: /(?!.*aus)(?=.*(美|🇺🇸|us(?!t)|usa|american|united states)).*/i, icon: `${iconBase}/flags/us.svg` },
  { name: 'JP日本', regex: /日本|🇯🇵|jp|japan/i, icon: `${iconBase}/flags/jp.svg` },
  { name: 'SG新加坡', regex: /新加坡|🇸🇬|sg|singapore/i, icon: `${iconBase}/flags/sg.svg` },
  { name: 'TW台湾', regex: /台湾|🇹🇼|tw|taiwan|tai wan/i, icon: `${iconBase}/flags/tw.svg` },
  { name: 'KR韩国', regex: /韩|🇰🇷|kr|korea/i, icon: `${iconBase}/flags/kr.svg` },
  { name: 'DE德国', regex: /德国|🇩🇪|de|germany/i, icon: `${iconBase}/flags/de.svg` },
  { name: 'GB英国', regex: /英|🇬🇧|uk|united kingdom|great britain/i, icon: `${iconBase}/flags/gb.svg` },
];

// 规则集配置
const ruleProviders = {
  // 广告拦截
  "reject": createRuleProvider("https://raw.githubusercontent.com/7fMeteor/AdsReject/main/clash-ads-reject.yaml", "./ruleset/loyalsoldier/reject.yaml"),
  
  // Loyalsoldier 基础规则
  "icloud": createRuleProvider("https://fastly.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/icloud.txt", "./ruleset/loyalsoldier/icloud.yaml"),
  "apple": createRuleProvider("https://fastly.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/apple.txt", "./ruleset/loyalsoldier/apple.yaml"),
  "google": createRuleProvider("https://fastly.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/google.txt", "./ruleset/loyalsoldier/google.yaml"),
  "proxy": createRuleProvider("https://fastly.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/proxy.txt", "./ruleset/loyalsoldier/proxy.yaml"),
  "direct": createRuleProvider("https://fastly.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/direct.txt", "./ruleset/loyalsoldier/direct.yaml"),
  "private": createRuleProvider("https://fastly.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/private.txt", "./ruleset/loyalsoldier/private.yaml"),
  "gfw": createRuleProvider("https://fastly.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/gfw.txt", "./ruleset/loyalsoldier/gfw.yaml"),
  "tld-not-cn": createRuleProvider("https://fastly.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/tld-not-cn.txt", "./ruleset/loyalsoldier/tld-not-cn.yaml"),
  
  // IP段规则 (需配合 no-resolve)
  "telegramcidr": createRuleProvider("https://fastly.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/telegramcidr.txt", "./ruleset/loyalsoldier/telegramcidr.yaml", "ipcidr"),
  "cncidr": createRuleProvider("https://fastly.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/cncidr.txt", "./ruleset/loyalsoldier/cncidr.yaml", "ipcidr"),
  "lancidr": createRuleProvider("https://fastly.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/lancidr.txt", "./ruleset/loyalsoldier/lancidr.yaml", "ipcidr"),
  
  // 经典行为规则
  "applications": createRuleProvider("https://fastly.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/applications.txt", "./ruleset/loyalsoldier/applications.yaml", "classical"),
  
  // MetaCubeX 规则集
  "openai": createRuleProvider("https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/classical/openai.yaml", "./ruleset/MetaCubeX/openai.yaml", "classical"),
  "bybit": createRuleProvider("https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/classical/bybit.yaml", "./ruleset/MetaCubeX/bybit.yaml", "classical"),
  "pikpak": createRuleProvider("https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/classical/pikpak.yaml", "./ruleset/MetaCubeX/pikpak.yaml", "classical"),
  "anthropic": createRuleProvider("https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/classical/anthropic.yaml", "./ruleset/MetaCubeX/anthropic.yaml", "classical"),
  "google-gemini": createRuleProvider("https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/classical/google-gemini.yaml", "./ruleset/MetaCubeX/google-gemini.yaml", "classical"),
  "xai": createRuleProvider("https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/classical/xai.yaml", "./ruleset/MetaCubeX/xai.yaml", "classical"),
  "perplexity": createRuleProvider("https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/classical/perplexity.yaml", "./ruleset/MetaCubeX/perplexity.yaml", "classical"),
  "microsoft": createRuleProvider("https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/classical/microsoft.yaml", "./ruleset/MetaCubeX/microsoft.yaml", "classical"),
};

// 规则
const rules = [
  // 远程控制与组网软件强制直连 (防卡顿) ---
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

  // 自定义直连/代理 (最高优先级)
  "PROCESS-NAME,steam.exe,🐬 自定义直连",
  "DOMAIN-SUFFIX,immersivetranslate.com,🐳 自定义代理",
  // "DOMAIN-SUFFIX,bing.com,🐳 自定义代理", // 原版保留注释
  
  // 谷歌服务优化
  "DOMAIN-SUFFIX,googleapis.cn,🔰 模式选择",
  "DOMAIN-SUFFIX,gstatic.com,🔰 模式选择",
  "DOMAIN-SUFFIX,xn--ngstr-lra8j.com,🔰 模式选择", // Google Play下载
  "DOMAIN-SUFFIX,github.io,🔰 模式选择",
  "DOMAIN,v2rayse.com,🔰 模式选择",
  
  // AI 服务
  "RULE-SET,openai,💸 Ai",
  "RULE-SET,google-gemini,💸 Ai",
  "RULE-SET,xai,💸 Ai",
  "RULE-SET,perplexity,💸 Ai",
  "RULE-SET,anthropic,💵 Claude",
  
  // 特定应用
  "RULE-SET,pikpak,🅿️ PikPak",
  "RULE-SET,bybit,🪙 Bybit",
  "RULE-SET,microsoft,Ⓜ️ 微软服务",
  "RULE-SET,icloud,🍎 苹果服务",
  "RULE-SET,apple,🍎 苹果服务",
  "RULE-SET,google,📢 谷歌服务",
  
  // 基础分类
  "RULE-SET,applications,🔗 全局直连",
  "RULE-SET,private,🔗 全局直连",
  "RULE-SET,reject,🥰 广告过滤",
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

// 代理组通用配置
const groupBaseOption = {
  "interval": 300, 
  "timeout": 3000,
  "url": "https://www.google.com/generate_204",
  "lazy": true,
  "max-failed-times": 3,
  "hidden": false
};

// 落地节点配置 (链式代理使用)
// ⚠️ 注意：如果没有落地节点，请保持数组为空，或不要填写空字符串，否则可能导致连接失败
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

// 程序入口
function main(config) {
  // 防御性编程：确保 config 对象存在
  if (!config) return config;
  
  const originalProxies = config?.proxies ? [...config.proxies] : [];
  const originalProviders = config?.["proxy-providers"] || {};
  
  // 全局内核参数优化
  config["unified-delay"] = true; // 真实延迟显示
  config["tcp-concurrent"] = true; // 开启TCP并发，提升加载速度
  config["profile"] = {
      "store-selected": true,
      "store-fake-ip": true
  };
  
  // 内核深度优化 ---
  config['find-process-mode'] = 'strict'; // 严格匹配进程名，让直连规则更准
  config['geodata-loader'] = 'memconservative'; // 节省内存模式
  config['keep-alive-interval'] = 1800; // 保持连接的间隔，省电/省资源
  
  // NTP 时间同步 (解决部分协议因时间误差无法连接的问题)
  config['ntp'] = {
    enable: true,
    'write-to-system': false, // 不写入系统时间，只供内核使用
    server: 'cn.ntp.org.cn', // 使用国内阿里/腾讯等 NTP 池
  };

  // 优化 TUN 模式下的 DNS 劫持 (防止 DNS 泄露)
  if (!config['tun']) config['tun'] = {};
  config['tun']['dns-hijack'] = ['any:53', 'tcp://any:53'];
  // 将 skipIps 应用到 TUN 排除列表，防止回环
  config['tun']['route-exclude-address'] = skipIps;

  // 开启流量嗅探，提升 Fake-IP 模式下的分流准确度
  config['sniffer'] = {
    enable: true,
    'force-dns-mapping': true,
    'parse-pure-ip': false,
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
    // 强制跳过嗅探的域名/关键词
    'skip-domain': ['Mijia Cloud', '+.oray.com', '+.push.apple.com', '+.apple.com', '+.google.com', '+.localhost', '*.local', '+.msftconnecttest.com', '+.msftncsi.com', '+.qq.com', '+.music.163.com', '+.steamcontent.com', 'xbox.*.microsoft.com', '+.battlenet.com.cn', '+.datarouter.cn', '+.game.rpg.qq.com'],
  };
  
  // 注入配置
  config["dns"] = dnsConfig;
  config["rule-providers"] = ruleProviders;
  config["rules"] = rules;

  // 处理原始代理 (强制开启 UDP)
  const processedProxies = originalProxies.map(proxy => {
      if (proxy && typeof proxy === 'object' && proxy.name) {
          proxy.udp = true;
      } else {
          return null;
      }
      return proxy;
  }).filter(p => p !== null);

  // 辅助函数：检测高倍率节点 (大于 3.0x 排除，防止流量偷跑)
  // 支持格式：x3.0, 3.0x, 3.0倍率, [3.0x] 等
  const checkHighMultiplier = (name) => {
      if (!name) return false;
      // 匹配 "3.0x", "x3", "3倍率" 等组合
      // 逻辑：匹配数字 + 紧邻的倍率符号，或者 倍率符号 + 紧邻的数字
      const pattern = /(?:^|\s|\[|\()((?:0\.\d+|[1-9]\d*(?:\.\d+)?))\s*(?:x|X|倍|倍率)(?:$|\s|\]|\))/;
      const patternReverse = /(?:x|X|倍|倍率)\s*((?:0\.\d+|[1-9]\d*(?:\.\d+)?))/;
      
      const m1 = name.match(pattern);
      if (m1 && parseFloat(m1[1]) > 3.0) return true;
      
      const m2 = name.match(patternReverse);
      if (m2 && parseFloat(m2[1]) > 3.0) return true;
      
      return false;
  };

  // 自动地区分组
  const regionGroups = {};
  const otherProxies = [];
  regionDefinitions.forEach(r => regionGroups[r.name] = { ...r, proxies: [] });

  processedProxies.forEach(proxy => {
      // 过滤高倍率节点
      if (checkHighMultiplier(proxy.name)) return;

      // 地区匹配
      let matched = false;
      for (const region of regionDefinitions) {
          if (region.regex.test(proxy.name)) {
              regionGroups[region.name].proxies.push(proxy.name);
              matched = true;
              break;
          }
      }
      if (!matched) otherProxies.push(proxy.name);
  });

  // 生成地区代理组
  const generatedRegionGroups = regionDefinitions
      .filter(r => regionGroups[r.name].proxies.length > 0)
      .map(r => ({
          ...groupBaseOption,
          "name": r.name,
          "type": "url-test",
          "tolerance": 50,
          "proxies": regionGroups[r.name].proxies,
          "icon": r.icon
      }));
  
  const regionGroupNames = generatedRegionGroups.map(g => g.name);

  // 落地节点处理 (增加空值过滤，防止报错)
  // 过滤掉 server 为空或无效的落地节点配置
  const validLandingNodes = landingNodeProxies.filter(p => p.server && p.server !== "");
  
  config["proxies"] = [...processedProxies, ...validLandingNodes];
  const landingNodeNames = validLandingNodes.map(p => p.name);

  // 转义正则元字符
  function escapeForRegExp(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // 构造排除落地节点的正则
  const excludeLandingFilter = landingNodeNames.length > 0
    ? `^(?:${landingNodeNames.map(escapeForRegExp).join('|')})$`
    : null;

  // 定义基础策略组
  const proxyGroupsConfig = [
    {
        ...groupBaseOption,
        "name": "🔰 模式选择",
        "type": "select",
        "proxies": [
            "⚙️ 节点选择",
            "🕊️ 落地节点",
            "🔗 全局直连",
            ...regionGroupNames // 注入地区组
        ],
        "icon": `${iconBase}/link.svg`
    },
    {
      ...groupBaseOption,
      "name": "⚙️ 节点选择",
      "type": "select",
      "proxies": ["♻️ 延迟选优", "🚑 故障转移", "⚖️ 负载均衡(散列)", "☁️ 负载均衡(轮询)", ...regionGroupNames, ...otherProxies],
      "include-all": true,
      "exclude-filter": excludeLandingFilter,
      "icon": `${iconBase}/adjust.svg`
    },
    {
      ...groupBaseOption,
      "name": "🕊️ 落地节点", 
      "type": "select",
      // 如果没有有效落地节点，自动回退到“节点选择”和“直连”
      "proxies": landingNodeNames.length > 0 ? [...landingNodeNames] : ["⚙️ 节点选择", "🔗 全局直连"], 
      "icon": `${iconBase}/openwrt.svg`
    },
    {
      ...groupBaseOption,
      "name": "♻️ 延迟选优",
      "type": "url-test",
      "tolerance": 50,
      "include-all": true,
      "exclude-filter": excludeLandingFilter,
      "icon": `${iconBase}/speed.svg`
    },
    {
      ...groupBaseOption,
      "name": "🚑 故障转移",
      "type": "fallback",
      "include-all": true,
      "exclude-filter": excludeLandingFilter,
      "icon": `${iconBase}/ambulance.svg`
    },
    {
      ...groupBaseOption,
      "name": "⚖️ 负载均衡(散列)",
      "type": "load-balance",
      "strategy": "consistent-hashing",
      "include-all": true,
      "exclude-filter": excludeLandingFilter,
      "icon": `${iconBase}/merry_go.svg`
    },
    {
      ...groupBaseOption,
      "name": "☁️ 负载均衡(轮询)",
      "type": "load-balance",
      "strategy": "round-robin",
      "include-all": true,
      "exclude-filter": excludeLandingFilter,
      "icon": `${iconBase}/balance.svg`
    },
    {
      ...groupBaseOption,
      "name": "🌍 国外媒体",
      "type": "select",
      "proxies": ["🔰 模式选择", "⚙️ 节点选择", "🕊️ 落地节点", "♻️ 延迟选优", "🚑 故障转移", "⚖️ 负载均衡(散列)", "☁️ 负载均衡(轮询)", "🔗 全局直连"],
      "include-all": true,
      "icon": `${iconBase}/youtube.svg`
    },
    {
      ...groupBaseOption,
      "name": "💸 Ai",
      "type": "select",
      "proxies": ["🔰 模式选择", "⚙️ 节点选择", "🕊️ 落地节点", "🔗 全局直连", "♻️ 延迟选优", "🚑 故障转移", "⚖️ 负载均衡(散列)", "☁️ 负载均衡(轮询)"],
      "include-all": true,
      "exclude-filter": "(?i)港|hk|hongkong|hong kong|俄|ru|russia|澳|macao",
      "icon": `${iconBase}/chatgpt.svg`
    },
    {
      ...groupBaseOption,
      "name": "💵 Claude",
      "type": "select",
      "proxies": ["🔰 模式选择", "⚙️ 节点选择", "🕊️ 落地节点", "🔗 全局直连", "♻️ 延迟选优", "🚑 故障转移", "⚖️ 负载均衡(散列)", "☁️ 负载均衡(轮询)"],
      "include-all": true,
      // 增加地区过滤，防止 Claude 误连香港节点导致封号
      "exclude-filter": "(?i)港|hk|hongkong|hong kong|俄|ru|russia|澳|macao|cn|china",
      "icon": `${iconBase}/claude.svg`
    },
    {
      ...groupBaseOption,
      "name": "🪙 Bybit",
      "type": "select",
      "proxies": ["🔰 模式选择", "⚙️ 节点选择", "🕊️ 落地节点", "🔗 全局直连", "♻️ 延迟选优", "🚑 故障转移", "⚖️ 负载均衡(散列)", "☁️ 负载均衡(轮询)"],
      "include-all": true,
      "icon": `${iconBase}/link.svg`
    },
    {
      ...groupBaseOption,
      "name": "🅿️ PikPak",
      "type": "select",
      "proxies": ["🔰 模式选择", "⚙️ 节点选择", "🕊️ 落地节点", "🔗 全局直连", "♻️ 延迟选优", "🚑 故障转移", "⚖️ 负载均衡(散列)", "☁️ 负载均衡(轮询)"],
      "include-all": true,
      "icon": `${iconBase}/link.svg`
    },
    {
      ...groupBaseOption,
      "name": "📲 电报消息",
      "type": "select",
      "proxies": ["🔰 模式选择", "⚙️ 节点选择", "🕊️ 落地节点", "♻️ 延迟选优", "🚑 故障转移", "🔗 全局直连"],
      "include-all": true,
      "icon": `${iconBase}/telegram.svg`
    },
    {
      ...groupBaseOption,
      "name": "📢 谷歌服务",
      "type": "select",
      "proxies": ["🔰 模式选择", "⚙️ 节点选择", "🕊️ 落地节点", "♻️ 延迟选优", "🚑 故障转移", "🔗 全局直连"],
      "include-all": true,
      "icon": `${iconBase}/google.svg`
    },
    {
      ...groupBaseOption,
      "name": "🍎 苹果服务",
      "type": "select",
      "proxies": ["🔰 模式选择", "⚙️ 节点选择", "🕊️ 落地节点", "♻️ 延迟选优", "🚑 故障转移", "🔗 全局直连"],
      "include-all": true,
      "icon": `${iconBase}/apple.svg`
    },
    {
      ...groupBaseOption,
      "name": "Ⓜ️ 微软服务",
      "type": "select",
      "proxies": ["🔰 模式选择", "⚙️ 节点选择", "🕊️ 落地节点", "🔗 全局直连", "♻️ 延迟选优", "🚑 故障转移"],
      "include-all": true,
      "icon": `${iconBase}/microsoft.svg`
    },
    {
      ...groupBaseOption,
      "name": "🥰 广告过滤",
      "type": "select",
      "proxies": ["REJECT", "DIRECT"],
      "icon": `${iconBase}/bug.svg`
    },
    {
      ...groupBaseOption,
      "name": "🔗 全局直连",
      "type": "select",
      "proxies": ["DIRECT", "⚙️ 节点选择", "♻️ 延迟选优", "🚑 故障转移", "⚖️ 负载均衡(散列)", "☁️ 负载均衡(轮询)"],
      "include-all": true,
      "icon": `${iconBase}/link.svg`
    },
    {
      ...groupBaseOption,
      "name": "❌ 全局拦截",
      "type": "select",
      "proxies": ["REJECT", "DIRECT"],
      "icon": `${iconBase}/block.svg`
    },
    {
      ...groupBaseOption,
      "name": "🐬 自定义直连",
      "type": "select",
      "include-all": true,
      "proxies": ["🔗 全局直连", "🔰 模式选择", "⚙️ 节点选择", "♻️ 延迟选优", "🚑 故障转移", "⚖️ 负载均衡(散列)", "☁️ 负载均衡(轮询)"],
      "icon": `${iconBase}/unknown.svg`
    },
    {
      ...groupBaseOption,
      "name": "🐳 自定义代理",
      "type": "select",
      "include-all": true,
      "proxies": ["🔰 模式选择", "⚙️ 节点选择", "🕊️ 落地节点", "♻️ 延迟选优", "🚑 故障转移", "⚖️ 负载均衡(散列)", "☁️ 负载均衡(轮询)", "🔗 全局直连"],
      "icon": `${iconBase}/openwrt.svg`
    },
    {
      ...groupBaseOption,
      "name": "🐟 漏网之鱼",
      "type": "select",
      "proxies": ["🔰 模式选择", "⚙️ 节点选择", "🕊️ 落地节点", "♻️ 延迟选优", "🚑 故障转移", "⚖️ 负载均衡(散列)", "☁️ 负载均衡(轮询)", "🔗 全局直连"],
      "include-all": true,
      "icon": `${iconBase}/fish.svg`
    }
  ];

  // 遍历所有代理组配置，应用落地节点排除过滤器
  const finalProxyGroups = proxyGroupsConfig.map(group => {
      // 检查当前组名是否在需要排除落地节点的列表中，并且确实有落地节点需要排除
      const groupsToExcludeLandingNodes = ["⚙️ 节点选择", "♻️ 延迟选优", "⚖️ 负载均衡(散列)", "☁️ 负载均衡(轮询)"];
      
      if (groupsToExcludeLandingNodes.includes(group.name) && excludeLandingFilter) {
          const existingFilter = group["exclude-filter"];
          group["exclude-filter"] = existingFilter
              ? `(${existingFilter})|(${excludeLandingFilter})`
              : excludeLandingFilter;
      }
      return group; 
  });

  // 合并功能组和自动生成的地区组
  config["proxy-groups"] = [...finalProxyGroups, ...generatedRegionGroups];
  
  // 注入外部 Provider
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

  return config;
}