/**
 * Clash Meta 扩展脚本
 * Author: Waster
 * Github：https://github.com/7fMeteor/AdsReject
 */

// 资源配置中心
// 统一管理远程资源的根路径，便于后续维护和更新
const ASSETS = {
    // 远程图标仓库基地址
    icons: "https://raw.githubusercontent.com/7fMeteor/AdsReject/main/icons",
    // 规则集源路径配置
    rules: {
        // 广告拦截规则集
        ads: "https://raw.githubusercontent.com/7fMeteor/AdsReject/main/clash-ads-reject.yaml",
        // MetaCubeX MRS 域名规则仓库
        geosite: "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite",
        // MetaCubeX MRS IP 规则仓库
        geoip: "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geoip"
    }
};

// 规则集提供者工厂函数
// 用于生成标准化的 http 类型 rule-provider 对象
// 参数 url: 远程规则集地址
// 参数 path: 本地保存路径
// 参数 behavior: 规则行为 (默认 domain)
// 参数 format: 规则格式 (默认 mrs)
// 参数 interval: 更新间隔 (默认 86400秒)
const createRuleProvider = (url, path, behavior = "domain", format = "mrs", interval = 86400) => ({
    "type": "http",
    "format": format,
    "interval": interval,
    "behavior": behavior,
    "url": url,
    "path": path
});

// 本地保留网段列表
// 用于 TUN 模式排除路由及 DNS 重绑定保护
const skipIps = [
    '127.0.0.0/8', // IPv4 Loopback (回环地址)
    '10.0.0.0/8', // LAN Class A (局域网)
    '100.64.0.0/10', // Carrier-Grade NAT (运营商保留)
    '169.254.0.0/16', // Link-Local (链路本地)
    '172.16.0.0/12', // LAN Class B (局域网)
    '192.0.0.0/24', // IETF Protocol Reserved (协议保留)
    '192.168.0.0/16', // LAN Class C (局域网)
    '224.0.0.0/4', // Multicast (组播/投屏)
    'FC00::/7', // IPv6 Unique Local (唯一本地)
    'FE80::/10', // IPv6 Link-Local (链路本地)
    '::1/128', // IPv6 Loopback (回环地址)
];

// 国内 DNS 服务器列表 (DoH)
const domesticNameservers = [
    "https://dns.alidns.com/dns-query", // 阿里 DoH (稳定)
    "https://doh.pub/dns-query", // 腾讯 DoH (覆盖广)
];

// 国外 DNS 服务器列表 (DoH)
const foreignNameservers = [
    "https://dns.google/dns-query", // Google DNS (精准度最高)
    // "https://dns.google/dns-query#ecs=1.1.1.1/24&ecs-override=true", // Google DNS (强制开启ECS)
    "https://cloudflare-dns.com/dns-query", // Cloudflare DNS (响应最快)
    "https://dns.quad9.net/dns-query", // Quad9 DNS (安全，备用)
    "https://doh.opendns.com/dns-query", // OpenDNS (老牌稳定，备用)
    // "https://doh.opendns.com/dns-query#ecs=1.1.1.1/24&ecs-override=true", // OpenDNS (强制开启ECS)
    "https://common.dot.dns.yandex.net/dns-query", // YandexDNS (俄罗斯 DNS，备用)
];

// 地区识别规则定义
// 用于从节点名称中提取地区信息并生成对应的策略组
const regionDefinitions = [
    {
        name: '🇭🇰 HK香港',
        regex: /港|🇭🇰|hk|hongkong|hong kong|(?:^|[^a-z])hk(?:[^a-z]|$)/i,
        icon: `${ASSETS.icons}/flags/hk.svg`
    },
    {
        name: '🇺🇸 US美国',
        regex: /(?!.*aus)(?=.*(美|🇺🇸|usa|american|united states|(?:^|[^a-z])us(?:(?!t)|[^a-z]|$))).*/i,
        icon: `${ASSETS.icons}/flags/us.svg`
    },
    {
        name: '🇯🇵 JP日本',
        regex: /日本|🇯🇵|japan|(?:^|[^a-z])jp(?:[^a-z]|$)/i,
        icon: `${ASSETS.icons}/flags/jp.svg`
    },
    {
        name: '🇸🇬 SG新加坡',
        regex: /新加坡|🇸🇬|singapore|(?:^|[^a-z])sg(?:[^a-z]|$)/i,
        icon: `${ASSETS.icons}/flags/sg.svg`
    },
    {
        name: '🇹🇼 TW台湾',
        regex: /台湾|🇹🇼|taiwan|tai wan|(?:^|[^a-z])tw(?:[^a-z]|$)/i,
        icon: `${ASSETS.icons}/flags/tw.svg`
    },
    {
        name: '🇰🇷 KR韩国',
        regex: /韩|🇰🇷|korea|(?:^|[^a-z])kr(?:[^a-z]|$)/i,
        icon: `${ASSETS.icons}/flags/kr.svg`
    },
    {
        name: '🇩🇪 DE德国',
        regex: /德国|🇩🇪|germany|(?:^|[^a-z])de(?:[^a-z]|$)/i,
        icon: `${ASSETS.icons}/flags/de.svg`
    },
    {
        name: '🇬🇧 GB英国',
        regex: /英|🇬🇧|united kingdom|great britain|(?:^|[^a-z])uk(?:[^a-z]|$)/i,
        icon: `${ASSETS.icons}/flags/gb.svg`
    }
];

// 落地节点配置列表
// 用于定义特殊的出口节点，支持在策略组中单独调用
// ⚠️ 注意：如果没有落地节点，请保持数组为空
const landingNodeProxies = [{
    "name": "webshare",
    "server": "", // 请在此处填写服务器地址 (必填)
    "port": 12345, // 端口
    "type": "socks5", // 协议类型
    "username": "", // 用户名
    "password": "", // 密码
    "tls": false,
    "skip-cert-verify": true,
    "udp": true,
    "dialer-proxy": "⚙️ 节点选择" // 前置代理
}];

// 自定义直连域名列表
const DirectDomains = [
    "apphot.cc", // 烈火资源站
    "wycad.com" // 无忧软件网
];

// 服务定义配置
// 用于自动生成 Rule Providers 和对应的策略组
// 包含服务标识、图标、规则集来源以及分流偏好
const serviceDefinitions = [
    // 广告拦截
    {
        id: "ads",
        name: "❌ 广告过滤",
        type: "reject",
        icon: `${ASSETS.icons}/block.svg`,
        ruleSets: [{
            id: "ads",
            url: ASSETS.rules.ads,
            path: "./ruleset/custom/ads.yaml",
            format: "yaml"
        }]
    },
    // AI 服务
    {
        id: "ai",
        name: "💸 Ai",
        icon: `${ASSETS.icons}/chatgpt.svg`,
        excludeCN: true,
        ruleSets: [{
            id: "ai_chat",
            url: `${ASSETS.rules.geosite}/category-ai-chat-!cn.mrs`,
            path: "./ruleset/geo/ai.mrs"
        }]
    },
    // 哔哩哔哩
    {
        id: "bilibili",
        name: "📺 哔哩哔哩",
        icon: `${ASSETS.icons}/bilibili.svg`,
        preferDirect: true,
        ruleSets: [{
            id: "bilibili",
            url: `${ASSETS.rules.geosite}/bilibili.mrs`,
            path: "./ruleset/geo/bili.mrs"
        }]
    },
    // 谷歌服务
    {
        id: "google",
        name: "📢 谷歌服务",
        icon: `${ASSETS.icons}/google.svg`,
        ruleSets: [{
            id: "google",
            url: `${ASSETS.rules.geosite}/google.mrs`,
            path: "./ruleset/geo/google.mrs"
        }]
    },
    // 国外媒体
    {
        id: "media",
        name: "🌍 国外媒体",
        icon: `${ASSETS.icons}/youtube.svg`,
        ruleSets: [{
            id: "entertainment",
            url: `${ASSETS.rules.geosite}/category-entertainment.mrs`,
            path: "./ruleset/geo/entertainment.mrs"
        }]
    },
    // 通讯软件
    // 此类应用对延迟敏感，独立分组以便优选线路
    {
        id: "communication",
        name: "💬 通讯软件",
        icon: `${ASSETS.icons}/telegram.svg`,
        ruleSets: [
            // 包含主流通讯软件域名的聚合规则
            {
                id: "communication",
                url: `${ASSETS.rules.geosite}/category-communication.mrs`,
                path: "./ruleset/geo/communication.mrs"
            },
            // 保留 Telegram IP 规则，解决部分网络环境下 TG 无法连接或头像加载慢的问题
            {
                id: "telegramcidr",
                url: `${ASSETS.rules.geoip}/telegram.mrs`,
                path: "./ruleset/geo/tg-ip.mrs",
                behavior: "ipcidr"
            }
        ]
    },
    // 社交媒体 (Facebook, Twitter, Instagram, Reddit 等)
    {
        id: "social_media",
        name: "🌌 社交媒体",
        icon: `${ASSETS.icons}/facebook.svg`,
        ruleSets: [
            // 包含非中国大陆社交平台的聚合规则
            {
                id: "social_media",
                url: `${ASSETS.rules.geosite}/category-social-media-!cn.mrs`,
                path: "./ruleset/geo/social.mrs"
            }
        ]
    },
    // 微软中国 (直连优先)
    {
        id: "microsoft_cn",
        name: "🇨🇳 微软中国",
        icon: `${ASSETS.icons}/microsoft.svg`,
        preferDirect: true,
        ruleSets: [{
            id: "microsoft_cn",
            url: `${ASSETS.rules.geosite}/microsoft@cn.mrs`,
            path: "./ruleset/geo/ms-cn.mrs"
        }]
    },
    // 微软国际 (代理优先)
    {
        id: "microsoft",
        name: "Ⓜ️ 微软国际",
        icon: `${ASSETS.icons}/microsoft.svg`,
        ruleSets: [{
            id: "microsoft",
            url: `${ASSETS.rules.geosite}/microsoft.mrs`,
            path: "./ruleset/geo/ms.mrs"
        }]
    },
    // 苹果中国 (直连优先)
    {
        id: "apple_cn",
        name: "🇨🇳 苹果中国",
        icon: `${ASSETS.icons}/apple.svg`,
        preferDirect: true,
        ruleSets: [{
            id: "apple_cn",
            url: `${ASSETS.rules.geosite}/apple@cn.mrs`,
            path: "./ruleset/geo/apple-cn.mrs"
        }]
    },
    // 苹果国际 (代理优先)
    {
        id: "apple",
        name: "🍎 苹果国际",
        icon: `${ASSETS.icons}/apple.svg`,
        ruleSets: [{
            id: "apple",
            url: `${ASSETS.rules.geosite}/apple.mrs`,
            path: "./ruleset/geo/apple.mrs"
        }]
    },
    // PikPak
    {
        id: "pikpak",
        name: "🅿️ PikPak",
        icon: `${ASSETS.icons}/pikpak.svg`,
        ruleSets: [{
            id: "pikpak",
            url: `${ASSETS.rules.geosite}/pikpak.mrs`,
            path: "./ruleset/geo/pikpak.mrs"
        }]
    },
    // Bybit
    {
        id: "bybit",
        name: "🪙 Bybit",
        icon: `${ASSETS.icons}/bybit.svg`,
        ruleSets: [{
            id: "bybit",
            url: `${ASSETS.rules.geosite}/bybit.mrs`,
            path: "./ruleset/geo/bybit.mrs"
        }]
    }
];

// 基础规则集映射
// 包含 GFW、CN 域名、LAN IP 等通用规则
const basicRuleSets = [
    // 局域网域名 (Private Domain)
    {
        id: "private_domain",
        url: `${ASSETS.rules.geosite}/private.mrs`,
        path: "./ruleset/geo/priv.mrs"
    },
    // 非中国域名 (TLD !CN)
    {
        id: "tld_not_cn",
        url: `${ASSETS.rules.geosite}/tld-!cn.mrs`,
        path: "./ruleset/geo/no-cn.mrs"
    },
    // 中国 IP 段 (CN CIDR)
    {
        id: "cncidr",
        url: `${ASSETS.rules.geoip}/cn.mrs`,
        path: "./ruleset/geo/cn-ip.mrs",
        behavior: "ipcidr"
    },
    // 局域网 IP 段 (LAN CIDR)
    {
        id: "lancidr",
        url: `${ASSETS.rules.geoip}/private.mrs`,
        path: "./ruleset/geo/lan-ip.mrs",
        behavior: "ipcidr"
    },
    // 中国域名 (CN Domain)
    {
        id: "cn_domain",
        url: `${ASSETS.rules.geosite}/cn.mrs`,
        path: "./ruleset/geo/cn.mrs"
    },
    // GFW 列表
    {
        id: "gfw",
        url: `${ASSETS.rules.geosite}/gfw.mrs`,
        path: "./ruleset/geo/gfw.mrs"
    },
    // 非中国 IP 归属
    {
        id: "geolocation_not_cn",
        url: `${ASSETS.rules.geosite}/geolocation-!cn.mrs`,
        path: "./ruleset/geo/geo-no-cn.mrs"
    }
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
    config["unified-delay"] = true; // 开启统一延迟测速
    config["tcp-concurrent"] = true; // 开启 TCP 并发连接
    config["global-client-fingerprint"] = "chrome"; // TLS 指纹模拟
    config['find-process-mode'] = 'strict'; // 严格模式匹配进程
    config['geodata-loader'] = 'memconservative'; // 内存优化模式加载 Geodata
    config['keep-alive-interval'] = 1800; // 长连接保活间隔

    // 强制关闭 GeoData 模式 (纯 Rule-Set 模式，避免下载大文件)
    config['geodata-mode'] = false;
    config['geo-auto-update'] = false;

    // NTP 时间同步配置
    config['ntp'] = {
        enable: true,
        'write-to-system': false,
        'dialer-proxy': "🔗 全局直连", // 明确指定直连，防止时间同步回环
        server: 'ntp.aliyun.com',
    };

    // TUN 模式 DNS 劫持配置
    if (!config['tun']) config['tun'] = {};
    config['tun']['dns-hijack'] = ['any:53', 'tcp://any:53'];
    config['tun']['route-exclude-address'] = skipIps;

    // Meta 内核 DNS 全局配置
    config["dns"] = {
        "enable": true,
        "listen": "0.0.0.0:1053",
        // "ipv6": true, // 根据本地网络环境决定是否开启
        "prefer-h3": true, // 开启 HTTP/3 支持，加速查询
        "respect-rules": true,
        "enhanced-mode": "fake-ip",
        "fake-ip-range": "198.18.0.1/16",
        // Fake-IP 过滤列表 (局域网及特殊验证域名走真实 IP)
        "fake-ip-filter": [
            "RULE-SET,private_domain",
            // Windows 网络连接探测 (防止任务栏显示无网络图标)
            "+.msftconnecttest.com",
            "+.msftncsi.com",
            // 游戏与 STUN 服务 (确保 NAT 类型开放，优化联机)
            "+.stun.*.*",
            "+.stun.*",
            "+.work.weixin.qq.com", // 企业微信有时会有 IP 校验问题
            "+.exmail.qq.com" // 腾讯企业邮箱
        ],
        // Bootstrap DNS 使用国内高可用 IP (用于解析 DoH 域名)
        "default-nameserver": [
            "223.5.5.5", // 阿里 DNS (主)
            "223.6.6.6", // 阿里 DNS (备)
            "119.29.29.29", // 腾讯 DNS
            "114.114.114.114", // 114 DNS (高可用保底)
            "180.76.76.76", // 百度 DNS（不推荐，仅做保底）
            "1.2.4.8" // CNNIC DNS（不推荐，仅做保底）
        ],
        // 主 DNS 服务器
        "nameserver": foreignNameservers,
        // 代理 DNS 服务器
        "proxy-server-nameserver": domesticNameservers,
        // 直连 DNS 服务器
        "direct-nameserver": domesticNameservers,
        // 策略分流
        "nameserver-policy": {
            "rule-set:cn_domain": domesticNameservers,
            "rule-set:private_domain": domesticNameservers,
            "rule-set:apple_cn": domesticNameservers,
            "rule-set:microsoft_cn": domesticNameservers,
            "rule-set:google": foreignNameservers,
            "rule-set:gfw": foreignNameservers
        },
        // 兜底过滤 (移除 GeoIP 校验，仅保留 CIDR)
        "fallback-filter": {
            "geoip": false,
            "ipcidr": ["240.0.0.0/4", "127.0.0.1/32", "10.0.0.0/8", "192.168.0.0/16"]
        }
    };

    // 流量嗅探配置 (Sniffer)
    config['sniffer'] = {
        enable: true,
        'force-dns-mapping': true,
        'parse-pure-ip': false, // 不嗅探纯 IP 连接，自动过滤掉大部分 P2P/BT 流量
        'override-destination': true,
        sniff: {
            TLS: {
                ports: [443, 8443]
            },
            HTTP: {
                ports: [80, '8080-8880']
            },
            QUIC: {
                ports: [443, 8443]
            }
        },
        // 强制嗅探列表 (防止 DNS 污染)
        // 确保引用的 rule-set 在 serviceDefinitions 中已定义
        'force-domain': [
            'rule-set:google',
            'rule-set:entertainment', // YouTube 等流媒体
            'rule-set:communication', // Telegram, WhatsApp 等
            'rule-set:social_media' // Facebook, Twitter 等
        ],
        // 跳过嗅探列表
        'skip-domain': [
            'Mijia Cloud',
            'rule-set:cn_domain',
            'rule-set:apple_cn',
            'rule-set:microsoft_cn'
        ]
    };

    // 代理节点处理：过滤无效节点并强制开启 UDP
    const processedProxies = originalProxies.map(p => (p && p.server) ? { ...p,
        udp: true
    } : null).filter(Boolean);

    // 辅助函数：识别并过滤高倍率节点 (>3.0x)
    const checkHighMultiplier = (name) => {
        const match = name.match(/(?:x|X|倍|倍率)\s*((?:0\.\d+|[1-9]\d*(?:\.\d+)?))/);
        return match && parseFloat(match[1]) > 3.0;
    };

    // 初始化地区分组容器
    const regionGroups = {};
    regionDefinitions.forEach(r => regionGroups[r.name] = { ...r,
        proxies: []
    });
    const otherRegionName = '🏁 其它地区';
    regionGroups[otherRegionName] = {
        name: otherRegionName,
        proxies: [],
        icon: `${ASSETS.icons}/flags/un.svg`
    };

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
        if (!matched) regionGroups[otherRegionName].proxies.push(proxy.name);
    });

    // 生成地区策略组 (嵌套逻辑：Select -> Auto)
    const groupBase = {
        "interval": 600,
        "timeout": 3000,
        "url": "https://www.gstatic.com/generate_204",
        "lazy": true,
        "max-failed-times": 3
    };
    const generatedRegionGroups = [];
    Object.values(regionGroups).filter(r => r.proxies.length > 0).forEach(r => {
        // 创建该地区的自动测速组
        const autoName = `⚡ 自动选择 ${r.name}`;
        generatedRegionGroups.push({ ...groupBase,
            "name": autoName,
            "type": "url-test",
            "tolerance": 50,
            "proxies": r.proxies,
            "hidden": true
        });
        // 创建该地区的对外展示组 (Select，允许手动或自动)
        generatedRegionGroups.push({ ...groupBase,
            "name": r.name,
            "type": "select",
            "proxies": [autoName, ...r.proxies],
            "icon": r.icon
        });
    });
    // 提取地区组名称 (仅提取暴露给用户的 Select 组)
    const regionGroupNames = generatedRegionGroups.filter(g => g.type === "select").map(g => g.name);
    // 提取有效落地节点
    const validLandingNodes = landingNodeProxies.filter(p => p.server);
    // 更新全局代理列表
    config["proxies"] = [...processedProxies, ...validLandingNodes];

    // 落地节点排除逻辑准备
    const landingNodeNames = validLandingNodes.map(p => p.name);
    // 构建落地节点排除正则
    const escapeForRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const excludeLandingFilter = landingNodeNames.length > 0 ? `^(?:${landingNodeNames.map(escapeForRegExp).join('|')})$` : null;
    // 定义需要动态排除落地节点的策略组名单
    const groupsToExcludeLandingNodes = ["⚙️ 节点选择", "♻️ 延迟选优", "🚑 故障转移", "⚖️ 负载均衡(散列)", "☁️ 负载均衡(轮询)"];

    // 动态构建 Rule Providers 和 Functional Groups
    const generatedRuleProviders = {};
    const generatedFunctionalGroups = [];
    const generatedRules = [];

    // 通用代理列表 (默认：代理优先)
    // 适用：Google, Telegram, ChatGPT, GitHub 等被墙服务
    const commonProxies = ["🔰 模式选择", "🌍 地区选择", "⚙️ 节点选择", "🕊️ 落地节点", "♻️ 延迟选优", "🚑 故障转移", "🔗 全局直连"];
    // 直连优先列表 (默认：直连优先)
    // 适用：Bilibili, Apple, Microsoft 等国内有 CDN 但偶尔需代理的服务
    const directFirstProxies = ["🔗 全局直连", "🔰 模式选择", "🌍 地区选择", "⚙️ 节点选择", "♻️ 延迟选优", "🚑 故障转移"];

    // 注入基础规则提供者
    basicRuleSets.forEach(set => generatedRuleProviders[set.id] = createRuleProvider(set.url, set.path, set.behavior));

    // 遍历服务定义，生成对应配置
    serviceDefinitions.forEach(svc => {
        // 生成 Rule Providers
        svc.ruleSets.forEach(set => generatedRuleProviders[set.id] = createRuleProvider(set.url, set.path, set.behavior, set.format || "mrs"));

        // 策略组权重分配
        let proxies = svc.preferDirect ? directFirstProxies : commonProxies;
        if (svc.type === "reject") proxies = ["REJECT", "DIRECT"];

        // 生成策略组对象
        const groupObj = { ...groupBase,
            name: svc.name,
            type: "select",
            proxies: proxies,
            icon: svc.icon
        };

        // 智能处理 include-all
        // 优先级：配置显式定义 > 广告拦截默认关闭 > 其他默认开启
        let shouldIncludeAll = true; // 默认行为：开启(显示全部节点)

        if (svc.includeAll !== undefined) {
            // 如果你在配置里显式写了 includeAll: true/false，完全按照配置
            shouldIncludeAll = svc.includeAll;
        } else if (svc.type === "reject") {
            // 如果没写配置，且是广告拦截类型，默认关闭
            shouldIncludeAll = false;
        }

        // 只有需要开启时，才写入内核识别的 "include-all" 属性
        if (shouldIncludeAll) {
            groupObj["include-all"] = true;
        }

        // 处理 exclude-filter (自动排除 CN 等节点)
        if (svc.excludeCN) {
            groupObj["exclude-filter"] = "(?i)(^|[^a-z])(港|hk|hongkong|澳|macao|俄|ru|russia|cn|china)([^a-z]|$)";
        }

        generatedFunctionalGroups.push(groupObj);

        // 生成 Rules
        svc.ruleSets.forEach(set => {
            const noRes = set.behavior === 'ipcidr' ? ",no-resolve" : "";
            generatedRules.push(`RULE-SET,${set.id},${svc.name}${noRes}`);
        });
    });

    // 核心管理组定义
    const groupDefinitions = [{
            name: "🔰 模式选择",
            type: "select",
            proxies: ["⚙️ 节点选择", "🌍 地区选择", "🕊️ 落地节点", "🔗 全局直连"],
            icon: `${ASSETS.icons}/cloudflare.svg`,
            includeAll: false
        },
        {
            name: "⚙️ 节点选择",
            type: "select",
            proxies: ["♻️ 延迟选优", "🌍 地区选择", "🚑 故障转移", "⚖️ 负载均衡(散列)", "☁️ 负载均衡(轮询)"],
            icon: `${ASSETS.icons}/adjust.svg`,
            includeAll: true
        },
        {
            name: "🌍 地区选择",
            type: "select",
            proxies: ["♻️ 延迟选优", ...regionGroupNames],
            condition: regionGroupNames.length > 0,
            icon: `${ASSETS.icons}/global.svg`,
            includeAll: false
        },
        {
            name: "🕊️ 落地节点",
            type: "select",
            proxies: landingNodeNames.length ? landingNodeNames : ["⚙️ 节点选择", "🔗 全局直连"],
            icon: `${ASSETS.icons}/openwrt.svg`,
            includeAll: false
        },
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
        {
            name: "🔗 全局直连",
            type: "select",
            proxies: ["DIRECT", "⚙️ 节点选择"],
            icon: `${ASSETS.icons}/link.svg`,
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

    // 构建最终策略组 (处理排除逻辑与 include-all)
    const finalCoreGroups = groupDefinitions.filter(g => g.condition !== false).map(g => {
        const group = { ...groupBase,
            ...g
        };

        // 动态逻辑：判断当前组是否需要排除落地节点
        const shouldAppendLandingExclude = groupsToExcludeLandingNodes.includes(g.name) && excludeLandingFilter;
        // 获取当前组已有的排除规则
        const currentExclude = g.exclude || "";

        // 智能合并排除规则
        // 如果需要排除落地节点，则将其追加到现有规则中 (使用 | 运算符)
        let finalFilter = currentExclude;
        if (shouldAppendLandingExclude) {
            finalFilter = currentExclude ? `(${currentExclude})|(${excludeLandingFilter})` : excludeLandingFilter;
        }

        // 仅当最终规则有效时写入配置
        if (finalFilter && finalFilter !== "") {
            group["exclude-filter"] = finalFilter;
        }

        // 仅当显式指定为 true 时开启 include-all
        if (g.includeAll === true) {
            group["include-all"] = true;
        }

        // 清理中间变量
        delete group.includeAll;
        delete group.condition;
        delete group.exclude;

        return group;
    });

    // 规则最终聚合 (静态高优 > 动态生成 > 基础兜底)
    const finalRules = [
        // 修复因为屏蔽 shuzilm.cn 导致的喜马拉雅 PC 无法播放的问题
        "DOMAIN-SUFFIX,shuzilm.cn,🔰 模式选择",
        // Steam
        "PROCESS-NAME-REGEX,(?i)^steam,🐬 自定义直连",
        // 哔哩哔哩安卓端包名
        "PROCESS-NAME,tv.danmaku.bili,📺 哔哩哔哩",
        // 沉浸式翻译浏览器插件
        "DOMAIN-SUFFIX,immersivetranslate.com,🐳 自定义代理",
        // Bing 搜索引擎
        // "DOMAIN-SUFFIX,bing.com,🐳 自定义代理",
        // 自定义直连列表
        ...DirectDomains.map(d => `DOMAIN-SUFFIX,${d},DIRECT`),
        // 动态生成列表
        ...generatedRules,
        "RULE-SET,private_domain,🔗 全局直连",
        "RULE-SET,cn_domain,🔗 全局直连",
        "RULE-SET,gfw,🔰 模式选择",
        "RULE-SET,tld_not_cn,🔰 模式选择",
        "RULE-SET,lancidr,🔗 全局直连,no-resolve",
        "RULE-SET,cncidr,🔗 全局直连,no-resolve",
        "MATCH,🐟 漏网之鱼"
    ];

    // 写入配置
    config["rule-providers"] = generatedRuleProviders;
    config["proxy-groups"] = [
        ...finalCoreGroups,
        ...generatedFunctionalGroups,
        ...generatedRegionGroups
    ];
    config["rules"] = finalRules;

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

    return config;
}
