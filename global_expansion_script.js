/***
 * Clash Meta 扩展脚本
 * Author: Waster
 * Github：https://github.com/7fMeteor/AdsReject
 */

// 辅助函数：创建远程规则集提供者 (Rule Provider)
const createRuleProvider = (url, path, behavior = "domain", format = "yaml", interval = 86400) => ({
  "type": "http",
  "format": format,
  "interval": interval,
  "behavior": behavior,
  "url": url,
  "path": path
});

// 需要绕过代理的本地与保留 IP 列表 (用于防止回环与直连)
const skipIps = [
  '10.0.0.0/8',
  '100.64.0.0/10',
  '169.254.0.0/16',
  '172.16.0.0/12',
  '192.0.0.0/24',
  '192.168.0.0/16',
  'FC00::/7',
  'FE80::/10',
  '::1/128',
];

// 图标基址
const iconBase = "https://raw.githubusercontent.com/7fMeteor/AdsReject/main/icons";

// 国内 DNS Over HTTPS (DoH) 服务器列表
// 策略：阿里(稳定) + 腾讯(覆盖广) + 字节(速度快)
const domesticNameservers = [
  "https://dns.alidns.com/dns-query", // 阿里DoH
  "https://doh.pub/dns-query", // 腾讯DoH
  "https://180.184.1.1/dns-query" // 字节跳动DoH，目前仅支持IPv4
];

// 国外 DNS Over HTTPS (DoH) 服务器列表
const foreignNameservers = [
  "https://cloudflare-dns.com/dns-query", // CloudflareDNS
  "https://common.dot.dns.yandex.net/dns-query", // YandexDNS
  "https://dns.google/dns-query#ecs=1.1.1.1/24&ecs-override=true", // GoogleDNS (强制开启ECS)
  "https://doh.opendns.com/dns-query#ecs=1.1.1.1/24&ecs-override=true", // OpenDNS (强制开启ECS)
  "https://dns.quad9.net/dns-query", // Quad9DNS
];

// 内核 DNS 全局配置对象
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

// 地区自动识别正则表达式与图标定义
const regionDefinitions = [
  { name: 'HK香港', regex: /港|🇭🇰|hongkong|hong kong|(?:^|[^a-z])hk(?:[^a-z]|$)/i, icon: `${iconBase}/flags/hk.svg` },
  { name: 'US美国', regex: /(?!.*aus)(?=.*(美|🇺🇸|usa|american|united states|(?:^|[^a-z])us(?:(?!t)|[^a-z]|$))).*/i, icon: `${iconBase}/flags/us.svg` },
  { name: 'JP日本', regex: /日本|🇯🇵|japan|(?:^|[^a-z])jp(?:[^a-z]|$)/i, icon: `${iconBase}/flags/jp.svg` },
  { name: 'SG新加坡', regex: /新加坡|🇸🇬|singapore|(?:^|[^a-z])sg(?:[^a-z]|$)/i, icon: `${iconBase}/flags/sg.svg` },
  { name: 'TW台湾', regex: /台湾|🇹🇼|taiwan|tai wan|(?:^|[^a-z])tw(?:[^a-z]|$)/i, icon: `${iconBase}/flags/tw.svg` },
  { name: 'KR韩国', regex: /韩|🇰🇷|korea|(?:^|[^a-z])kr(?:[^a-z]|$)/i, icon: `${iconBase}/flags/kr.svg` },
  { name: 'DE德国', regex: /德国|🇩🇪|germany|(?:^|[^a-z])de(?:[^a-z]|$)/i, icon: `${iconBase}/flags/de.svg` },
  { name: 'GB英国', regex: /英|🇬🇧|united kingdom|great britain|(?:^|[^a-z])uk(?:[^a-z]|$)/i, icon: `${iconBase}/flags/gb.svg` },
  { name: 'FR法国', regex: /法|🇫🇷|france|(?:^|[^a-z])fr(?:[^a-z]|$)/i, icon: `${iconBase}/flags/fr.svg` },
  { name: 'CA加拿大', regex: /加|🇨🇦|canada|(?:^|[^a-z])ca(?:[^a-z]|$)/i, icon: `${iconBase}/flags/ca.svg` },
  { name: 'AU澳洲', regex: /澳|🇦🇺|australia|(?:^|[^a-z])au(?:[^a-z]|$)/i, icon: `${iconBase}/flags/au.svg` },
  { name: 'NL荷兰', regex: /荷|🇳🇱|netherlands|(?:^|[^a-z])nl(?:[^a-z]|$)/i, icon: `${iconBase}/flags/nl.svg` },
  { name: 'RU俄罗斯', regex: /俄|🇷🇺|russia|(?:^|[^a-z])ru(?:[^a-z]|$)/i, icon: `${iconBase}/flags/ru.svg` },
  { name: 'IN印度', regex: /印|🇮🇳|india|(?:^|[^a-z])in(?:[^a-z]|$)/i, icon: `${iconBase}/flags/in.svg` },
];

// 规则集 (Rule Providers) 的源地址与存储配置
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
  // 哔哩哔哩
  "bilibili": createRuleProvider("https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/classical/bilibili.yaml", "./ruleset/MetaCubeX/bilibili.yaml", "classical"),
  // AI 等规则集
  "openai": createRuleProvider("https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/classical/openai.yaml", "./ruleset/MetaCubeX/openai.yaml", "classical"),
  "bybit": createRuleProvider("https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/classical/bybit.yaml", "./ruleset/MetaCubeX/bybit.yaml", "classical"),
  "pikpak": createRuleProvider("https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/classical/pikpak.yaml", "./ruleset/MetaCubeX/pikpak.yaml", "classical"),
  "anthropic": createRuleProvider("https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/classical/anthropic.yaml", "./ruleset/MetaCubeX/anthropic.yaml", "classical"),
  "google-gemini": createRuleProvider("https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/classical/google-gemini.yaml", "./ruleset/MetaCubeX/google-gemini.yaml", "classical"),
  "xai": createRuleProvider("https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/classical/xai.yaml", "./ruleset/MetaCubeX/xai.yaml", "classical"),
  "perplexity": createRuleProvider("https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/classical/perplexity.yaml", "./ruleset/MetaCubeX/perplexity.yaml", "classical"),
  "microsoft": createRuleProvider("https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/classical/microsoft.yaml", "./ruleset/MetaCubeX/microsoft.yaml", "classical"),
};

// 流量分流静态规则列表 (按优先级排序)
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

  // 自定义直连/代理
  // Steam PC
  "PROCESS-NAME,steam.exe,🐬 自定义直连",
  // 喜马拉雅 PC 端
  "PROCESS-NAME,喜马拉雅.exe,🐬 自定义直连",
  // 哔哩哔哩安卓端
  "PROCESS-NAME,tv.danmaku.bili,📺 哔哩哔哩",
  // 沉浸式翻译插件
  "DOMAIN-SUFFIX,immersivetranslate.com,🐳 自定义代理",
  // Bing 搜索引擎
  // "DOMAIN-SUFFIX,bing.com,🐳 自定义代理",

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

  // 哔哩哔哩
  "RULE-SET,bilibili,📺 哔哩哔哩",

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

// 代理策略组通用基础配置 (测速、超时等参数)
// 和手动测出来的差距大，是因为应用本身的测试去掉了握手等额外延迟
// 此结果只用于“延迟选优”，建议自行手动测试
const groupBaseOption = {
  // 自动定时延迟检查，值：*分钟✖️60
  "interval": 600,
  "timeout": 3000,
  // 如果使用 http 协议，可以避开加密握手延迟，但是有概率被劫持
  "url": "https://www.gstatic.com/generate_204", // 这里使用 https 协议，自动测试结果也会更高
  "lazy": true,
  "max-failed-times": 3,
  "hidden": false
};

// 落地节点 (Landing Node) 手动配置列表
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

// 脚本主执行入口
function main(config) {
  // 防御性编程：确保 config 对象存在
  if (!config) return config;

  // 原始代理节点列表备份
  const originalProxies = config?.proxies ? [...config.proxies] : [];

  // 原始代理提供者 (Proxy Providers) 备份
  const originalProviders = config?.["proxy-providers"] || {};

  // 全局内核参数优化
  config["unified-delay"] = true; // 真实延迟显示
  config["tcp-concurrent"] = true; // 开启TCP并发，提升加载速度
  config["profile"] = {
    "store-selected": true,
    "store-fake-ip": true
  };

  // 内核深度优化
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

  // 处理并提取所有原始代理节点 (强制开启 UDP)
  const processedProxies = originalProxies.map(proxy => {
    if (proxy && typeof proxy === 'object' && proxy.name) {
      proxy.udp = true;
    } else {
      return null;
    }
    return proxy;
  }).filter(p => p !== null);

  // 辅助方法：识别并过滤高倍率节点 (大于 3.0x 排除)
  const checkHighMultiplier = (name) => {
    if (!name) return false;
    // 逻辑：匹配数字 + 紧邻的倍率符号，或者 倍率符号 + 紧邻的数字
    const pattern = /(?:^|\s|\[|\()((?:0\.\d+|[1-9]\d*(?:\.\d+)?))\s*(?:x|X|倍|倍率)(?:$|\s|\]|\))/;
    const patternReverse = /(?:x|X|倍|倍率)\s*((?:0\.\d+|[1-9]\d*(?:\.\d+)?))/;

    const m1 = name.match(pattern);
    if (m1 && parseFloat(m1[1]) > 3.0) return true;

    const m2 = name.match(patternReverse);
    if (m2 && parseFloat(m2[1]) > 3.0) return true;

    return false;
  };

  // 地区分类存储对象
  const regionGroups = {};

  // 初始化已定义的地区分组
  regionDefinitions.forEach(r => regionGroups[r.name] = { ...r, proxies: [] });

  // 未识别地区的默认分类组名
  const otherRegionName = '🏁 其它地区';

  // 初始化“其它地区”分组
  regionGroups[otherRegionName] = { name: otherRegionName, proxies: [], icon: `${iconBase}/flags/un.svg` };

  // 遍历节点进行地区归类
  processedProxies.forEach(proxy => {
    // 过滤高倍率节点
    if (checkHighMultiplier(proxy.name)) return;

    // 地区正则匹配
    let matched = false;
    for (const region of regionDefinitions) {
      if (region.regex.test(proxy.name)) {
        regionGroups[region.name].proxies.push(proxy.name);
        matched = true;
        break;
      }
    }
    // 未匹配节点归入其它
    if (!matched) {
      regionGroups[otherRegionName].proxies.push(proxy.name);
    }
  });

  // 生成最终生效的具体地区代理组列表
  const generatedRegionGroups = Object.values(regionGroups)
    .filter(r => r.proxies.length > 0)
    .map(r => ({
      ...groupBaseOption,
      "name": r.name,
      "type": "url-test",
      "tolerance": 50,
      "proxies": r.proxies,
      "icon": r.icon
    }));

  // 提取生成的地区代理组名称
  const regionGroupNames = generatedRegionGroups.map(g => g.name);

  // 过滤并提取有效的落地节点
  const validLandingNodes = landingNodeProxies.filter(p => p.server && p.server !== "");

  // 更新全局代理列表 (包含处理后的原始节点与落地节点)
  config["proxies"] = [...processedProxies, ...validLandingNodes];

  // 提取落地节点名称列表
  const landingNodeNames = validLandingNodes.map(p => p.name);

  // 辅助方法：对字符串进行正则转义处理
  function escapeForRegExp(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // 构造落地节点排除正则表达式 (用于自动选优组)
  const excludeLandingFilter = landingNodeNames.length > 0
    ? `^(?:${landingNodeNames.map(escapeForRegExp).join('|')})$`
    : null;

  // 构造基础业务策略组 (并在此处定义 Tab 视觉排序)
  const proxyGroupsConfig = [
    {
      ...groupBaseOption,
      "name": "🔰 模式选择",
      "type": "select",
      "proxies": ["⚙️ 节点选择", "🌍 地区选择", "🕊️ 落地节点", "🔗 全局直连"],
      "icon": `${iconBase}/link.svg`
    },
    {
      ...groupBaseOption,
      "name": "⚙️ 节点选择",
      "type": "select",
      "proxies": ["♻️ 延迟选优", "🌍 地区选择", "🚑 故障转移", "⚖️ 负载均衡(散列)", "☁️ 负载均衡(轮询)"],
      "include-all": true,
      "exclude-filter": excludeLandingFilter,
      "icon": `${iconBase}/adjust.svg`
    }
  ];

  if (regionGroupNames.length > 0) {
    proxyGroupsConfig.push({
      ...groupBaseOption,
      "name": "🌍 地区选择",
      "type": "select",
      "proxies": ["♻️ 延迟选优", ...regionGroupNames],
      "icon": `${iconBase}/global.svg`
    });
  }

  proxyGroupsConfig.push(
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
      "name": "📺 哔哩哔哩",
      "type": "select",
      "proxies": ["🔗 全局直连", "🔰 模式选择", "🌍 地区选择", "⚙️ 节点选择", "♻️ 延迟选优"],
      "icon": `${iconBase}/bilibili.svg`
    },
    {
      ...groupBaseOption,
      "name": "🌍 国外媒体",
      "type": "select",
      "proxies": ["🔰 模式选择", "🌍 地区选择", "⚙️ 节点选择", "🕊️ 落地节点", "♻️ 延迟选优", "🚑 故障转移", "🔗 全局直连"],
      "include-all": true,
      "icon": `${iconBase}/youtube.svg`
    },
    {
      ...groupBaseOption,
      "name": "💸 Ai",
      "type": "select",
      "proxies": ["🔰 模式选择", "🌍 地区选择", "⚙️ 节点选择", "🕊️ 落地节点", "🔗 全局直连", "♻️ 延迟选优"],
      "include-all": true,
      "exclude-filter": "(?i)港|hk|hongkong|hong kong|俄|ru|russia|澳|macao",
      "icon": `${iconBase}/chatgpt.svg`
    },
    {
      ...groupBaseOption,
      "name": "💵 Claude",
      "type": "select",
      "proxies": ["🔰 模式选择", "🌍 地区选择", "⚙️ 节点选择", "🕊️ 落地节点", "🔗 全局直连", "♻️ 延迟选优"],
      "include-all": true,
      // 增加地区过滤，防止 Claude 误连香港节点导致封号
      "exclude-filter": "(?i)港|hk|hongkong|hong kong|俄|ru|russia|澳|macao|cn|china",
      "icon": `${iconBase}/claude.svg`
    },
    {
      ...groupBaseOption,
      "name": "🪙 Bybit",
      "type": "select",
      "proxies": ["🔰 模式选择", "🌍 地区选择", "⚙️ 节点选择", "🕊️ 落地节点", "🔗 全局直连", "♻️ 延迟选优"],
      "include-all": true,
      "icon": `${iconBase}/bybit.svg`
    },
    {
      ...groupBaseOption,
      "name": "🅿️ PikPak",
      "type": "select",
      "proxies": ["🔰 模式选择", "🌍 地区选择", "⚙️ 节点选择", "🕊️ 落地节点", "🔗 全局直连", "♻️ 延迟选优"],
      "include-all": true,
      "icon": `${iconBase}/pikpak.svg`
    },
    {
      ...groupBaseOption,
      "name": "📲 电报消息",
      "type": "select",
      "proxies": ["🔰 模式选择", "🌍 地区选择", "⚙️ 节点选择", "🕊️ 落地节点", "♻️ 延迟选优", "🔗 全局直连"],
      "include-all": true,
      "icon": `${iconBase}/telegram.svg`
    },
    {
      ...groupBaseOption,
      "name": "📢 谷歌服务",
      "type": "select",
      "proxies": ["🔰 模式选择", "🌍 地区选择", "⚙️ 节点选择", "🕊️ 落地节点", "♻️ 延迟选优", "🔗 全局直连"],
      "include-all": true,
      "icon": `${iconBase}/google.svg`
    },
    {
      ...groupBaseOption,
      "name": "🍎 苹果服务",
      "type": "select",
      "proxies": ["🔰 模式选择", "🌍 地区选择", "⚙️ 节点选择", "🕊️ 落地节点", "♻️ 延迟选优", "🔗 全局直连"],
      "include-all": true,
      "icon": `${iconBase}/apple.svg`
    },
    {
      ...groupBaseOption,
      "name": "Ⓜ️ 微软服务",
      "type": "select",
      "proxies": ["🔰 模式选择", "🌍 地区选择", "⚙️ 节点选择", "🕊️ 落地节点", "🔗 全局直连", "♻️ 延迟选优"],
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
      "proxies": ["DIRECT", "⚙️ 节点选择", "🌍 地区选择", "♻️ 延迟选优"],
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
      "proxies": ["🔗 全局直连", "🔰 模式选择", "🌍 地区选择", "⚙️ 节点选择"],
      "icon": `${iconBase}/unknown.svg`
    },
    {
      ...groupBaseOption,
      "name": "🐳 自定义代理",
      "type": "select",
      "include-all": true,
      "proxies": ["🔰 模式选择", "🌍 地区选择", "⚙️ 节点选择", "🕊️ 落地节点", "♻️ 延迟选优", "🔗 全局直连"],
      "icon": `${iconBase}/openwrt.svg`
    },
    {
      ...groupBaseOption,
      "name": "🐟 漏网之鱼",
      "type": "select",
      "proxies": ["🔰 模式选择", "🌍 地区选择", "⚙️ 节点选择", "🕊️ 落地节点", "♻️ 延迟选优", "🔗 全局直连"],
      "include-all": true,
      "icon": `${iconBase}/fish.svg`
    }
  );

  // 遍历所有生成的代理组，应用落地节点排除过滤器 (exclude-filter)
  const finalProxyGroups = proxyGroupsConfig.map(group => {
    // 检查当前组名是否在需要排除落地节点的列表中
    const groupsToExcludeLandingNodes = ["⚙️ 节点选择", "♻️ 延迟选优", "⚖️ 负载均衡(散列)", "☁️ 负载均衡(轮询)"];

    if (groupsToExcludeLandingNodes.includes(group.name) && excludeLandingFilter) {
      const existingFilter = group["exclude-filter"];
      group["exclude-filter"] = existingFilter
        ? `(${existingFilter})|(${excludeLandingFilter})`
        : excludeLandingFilter;
    }
    return group;
  });

  // 合并功能组、地区选择入口组以及具体的地区选优组
  config["proxy-groups"] = [...finalProxyGroups, ...generatedRegionGroups];

  // 注入并合并外部代理提供者 (Proxy Providers)
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

  // 返回最终生成的配置对象
  return config;
}
