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

// 图标基地址
const iconBase = "https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color";

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
  { name: 'HK香港', regex: /港|🇭🇰|hk|hongkong|hong kong/i, icon: `${iconBase}/Hong_Kong.png` },
  { name: 'US美国', regex: /(?!.*aus)(?=.*(美|🇺🇸|us(?!t)|usa|american|united states)).*/i, icon: `${iconBase}/United_States.png` },
  { name: 'JP日本', regex: /日本|🇯🇵|jp|japan/i, icon: `${iconBase}/Japan.png` },
  { name: 'SG新加坡', regex: /新加坡|🇸🇬|sg|singapore/i, icon: `${iconBase}/Singapore.png` },
  { name: 'TW台湾省', regex: /台湾|🇹🇼|tw|taiwan|tai wan/i, icon: `${iconBase}/China.png` },
  { name: 'KR韩国', regex: /韩|🇰🇷|kr|korea/i, icon: `${iconBase}/Korea.png` },
  { name: 'DE德国', regex: /德国|🇩🇪|de|germany/i, icon: `${iconBase}/Germany.png` },
  { name: 'GB英国', regex: /英|🇬🇧|uk|united kingdom|great britain/i, icon: `${iconBase}/United_Kingdom.png` },
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
  "RULE-SET,openai,💸 ChatGPT-Gemini-XAI-Perplexity",
  "RULE-SET,google-gemini,💸 ChatGPT-Gemini-XAI-Perplexity",
  "RULE-SET,xai,💸 ChatGPT-Gemini-XAI-Perplexity",
  "RULE-SET,perplexity,💸 ChatGPT-Gemini-XAI-Perplexity",
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
    // 如果没有落地节点，建议注释掉上方对象，保留空数组
];

// 程序入口
function main(config) {
  const originalProxies = config?.proxies ? [...config.proxies] : [];
  const originalProviders = config?.["proxy-providers"] || {};
  
    // 全局内核参数优化
  config["unified-delay"] = true; // 真实延迟显示
  config["tcp-concurrent"] = true; // 开启TCP并发，提升加载速度
  config["profile"] = {
      "store-selected": true,
      "store-fake-ip": true
  };
  // 开启流量嗅探，提升 Fake-IP 模式下的分流准确度
  config["sniffer"] = {
      "enable": true,
      "parse-pure-ip": true,
      "sniff": {
          "TLS": { "ports": [443, 8443] },
          "HTTP": { "ports": [80, "8080-8880"], "override-destination": true }
      }
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

  // 自动地区分组与高倍率过滤
  const regionGroups = {};
  const otherProxies = [];
  // 倍率正则：匹配 x2.0, 3x, 5倍率 等格式
  const multiplierRegex = /(?<=[xX✕✖⨉倍率])([1-9]+(\.\d+)*|0{1}\.\d+)(?=[xX✕✖⨉倍率])*/i;

  regionDefinitions.forEach(r => regionGroups[r.name] = { ...r, proxies: [] });

  processedProxies.forEach(proxy => {
      // 过滤高倍率节点 (大于 3.0x 排除，防止流量偷跑)
      const match = multiplierRegex.exec(proxy.name);
      if (match && parseFloat(match[1]) > 3.0) return;

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
        "icon": `${iconBase}/Proxy.png`
    },
    {
      ...groupBaseOption,
      "name": "⚙️ 节点选择",
      "type": "select",
      "proxies": ["♻️ 延迟选优", "🚑 故障转移", "⚖️ 负载均衡(散列)", "☁️ 负载均衡(轮询)", ...regionGroupNames, ...otherProxies],
      "include-all": true,
      "exclude-filter": excludeLandingFilter,
      "icon": `${iconBase}/Adjust.png`
    },
    {
      ...groupBaseOption,
      "name": "🕊️ 落地节点", 
      "type": "select",
      "proxies": landingNodeNames.length > 0 ? [...landingNodeNames] : ["REJECT"], // 如果没有落地节点，防空处理
      "icon": `${iconBase}/Server.png`
    },
    {
      ...groupBaseOption,
      "name": "♻️ 延迟选优",
      "type": "url-test",
      "tolerance": 50,
      "include-all": true,
      "exclude-filter": excludeLandingFilter,
      "icon": `${iconBase}/Speed.png`
    },
    {
      ...groupBaseOption,
      "name": "🚑 故障转移",
      "type": "fallback",
      "include-all": true,
      "exclude-filter": excludeLandingFilter,
      "icon": `${iconBase}/Ambulance.png`
    },
    {
      ...groupBaseOption,
      "name": "⚖️ 负载均衡(散列)",
      "type": "load-balance",
      "strategy": "consistent-hashing",
      "include-all": true,
      "exclude-filter": excludeLandingFilter,
      "icon": `${iconBase}/Merry_Go.png`
    },
    {
      ...groupBaseOption,
      "name": "☁️ 负载均衡(轮询)",
      "type": "load-balance",
      "strategy": "round-robin",
      "include-all": true,
      "exclude-filter": excludeLandingFilter,
      "icon": `${iconBase}/Balance.png`
    },
    {
      ...groupBaseOption,
      "name": "🌍 国外媒体",
      "type": "select",
      "proxies": ["🔰 模式选择", "⚙️ 节点选择", "🕊️ 落地节点", "♻️ 延迟选优", "🚑 故障转移", "⚖️ 负载均衡(散列)", "☁️ 负载均衡(轮询)", "🔗 全局直连"],
      "include-all": true,
      "icon": `${iconBase}/YouTube.png`
    },
    {
      ...groupBaseOption,
      "name": "💸 ChatGPT-Gemini-XAI-Perplexity",
      "type": "select",
      // 智能筛选：优先使用美国/日本/新加坡等常用节点
      "proxies": [...regionGroupNames.filter(n => /US|JP|SG|TW/.test(n)), "🔰 模式选择", "⚙️ 节点选择", "🕊️ 落地节点"],
      "include-all": true,
      "exclude-filter": "(?i)港|hk|hongkong|hong kong|俄|ru|russia|澳|macao",
      "icon": `${iconBase}/ChatGPT.png`
    },
    {
      ...groupBaseOption,
      "name": "💵 Claude",
      "type": "select",
      "proxies": [...regionGroupNames.filter(n => /US|JP|SG|GB/.test(n)), "🔰 模式选择", "⚙️ 节点选择", "🕊️ 落地节点"],
      "include-all": true,
      "icon": `${iconBase}/Claude.png`
    },
    {
      ...groupBaseOption,
      "name": "🪙 Bybit",
      "type": "select",
      "proxies": ["🔰 模式选择", "⚙️ 节点选择", "🕊️ 落地节点", ...regionGroupNames],
      "include-all": true,
      "icon": `${iconBase}/Link.png`
    },
    {
      ...groupBaseOption,
      "name": "🅿️ PikPak",
      "type": "select",
      "proxies": ["🔰 模式选择", "⚙️ 节点选择", "🕊️ 落地节点", ...regionGroupNames],
      "include-all": true,
      "icon": `${iconBase}/Link.png`
    },
    {
      ...groupBaseOption,
      "name": "📲 电报消息",
      "type": "select",
      "proxies": ["🔰 模式选择", "⚙️ 节点选择", "🕊️ 落地节点", ...regionGroupNames],
      "include-all": true,
      "icon": `${iconBase}/Telegram.png`
    },
    {
      ...groupBaseOption,
      "name": "📢 谷歌服务",
      "type": "select",
      "proxies": ["🔰 模式选择", "⚙️ 节点选择", "🕊️ 落地节点", ...regionGroupNames],
      "include-all": true,
      "icon": `${iconBase}/Google.png`
    },
    {
      ...groupBaseOption,
      "name": "🍎 苹果服务",
      "type": "select",
      "proxies": ["🔰 模式选择", "⚙️ 节点选择", "🕊️ 落地节点", ...regionGroupNames],
      "include-all": true,
      "icon": `${iconBase}/Apple.png`
    },
    {
      ...groupBaseOption,
      "name": "Ⓜ️ 微软服务",
      "type": "select",
      "proxies": ["🔰 模式选择", "⚙️ 节点选择", "🕊️ 落地节点", ...regionGroupNames],
      "include-all": true,
      "icon": `${iconBase}/Microsoft.png`
    },
    {
      ...groupBaseOption,
      "name": "🥰 广告过滤",
      "type": "select",
      "proxies": ["REJECT", "DIRECT"],
      "icon": `${iconBase}/Bug.png`
    },
    {
      ...groupBaseOption,
      "name": "🔗 全局直连",
      "type": "select",
      "proxies": ["DIRECT", "⚙️ 节点选择", "♻️ 延迟选优", "⚖️ 负载均衡(散列)", "☁️ 负载均衡(轮询)"],
      "include-all": true,
      "icon": `${iconBase}/Link.png`
    },
    {
      ...groupBaseOption,
      "name": "❌ 全局拦截",
      "type": "select",
      "proxies": ["REJECT", "DIRECT"],
      "icon": `${iconBase}/Block.png`
    },
    {
      ...groupBaseOption,
      "name": "🐬 自定义直连",
      "type": "select",
      "include-all": true,
      "proxies": ["🔗 全局直连", "🔰 模式选择", "⚙️ 节点选择", ...regionGroupNames],
      "icon": `${iconBase}/Unknown.png`
    },
    {
      ...groupBaseOption,
      "name": "🐳 自定义代理",
      "type": "select",
      "include-all": true,
      "proxies": ["🔰 模式选择", "⚙️ 节点选择", "🕊️ 落地节点", ...regionGroupNames],
      "icon": `${iconBase}/Openwrt.png`
    },
    {
      ...groupBaseOption,
      "name": "🐟 漏网之鱼",
      "type": "select",
      "proxies": ["🔰 模式选择", "⚙️ 节点选择", "🕊️ 落地节点", "🔗 全局直连"],
      "include-all": true,
      "icon": `${iconBase}/Fish.png`
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
    // 示例订阅 (⚠️ 必须替换为真实链接)
    "p1": {
      "type": "http",   // 订阅链接
      "url": "https://google.com", // ⚠️ 请替换此处 URL
      "interval": 86400,
      "proxy": "🔰 模式选择",
      "override": { 
        "additional-prefix": "p1 |"
      }
    }
  };

  return config;
}