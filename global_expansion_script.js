/**
 * Clash Meta 扩展脚本
 * Author: Waster
 * Github：https://github.com/7fMeteor/AdsReject
 */

const ASSETS = {
    icons: "https://raw.githubusercontent.com/7fMeteor/AdsReject/main/icons",
    rules: {
        waster: "https://raw.githubusercontent.com/7fMeteor/AdsReject/main",
        geosite: "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite",
        geoip: "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geoip"
    }
};

const createRuleProvider = (url, path, behavior = "domain", format = "mrs", interval = 86400) => ({
    "type": "http",
    "format": format,
    "interval": interval,
    "behavior": behavior,
    "url": url,
    "path": path
});

const skipIps = [
    '127.0.0.0/8',
    '10.0.0.0/8',
    '100.64.0.0/10',
    '169.254.0.0/16',
    '172.16.0.0/12',
    '192.0.0.0/24',
    '192.168.0.0/16',
    '224.0.0.0/4',
    'FC00::/7',
    'FE80::/10',
    '::1/128',
];

const domesticNameservers = [
    "https://dns.alidns.com/dns-query",
    "https://doh.pub/dns-query",
];

const foreignNameservers = [
    "https://dns.google/dns-query",
    // "https://dns.google/dns-query#ecs=1.1.1.1/24&ecs-override=true",
    "https://cloudflare-dns.com/dns-query",
    "https://dns.quad9.net/dns-query",
    "https://doh.opendns.com/dns-query",
    // "https://doh.opendns.com/dns-query#ecs=1.1.1.1/24&ecs-override=true",
    "https://common.dot.dns.yandex.net/dns-query",
];

const regionDefinitions = [{
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

const landingNodeProxies = [{
    "name": "webshare",
    "server": "",
    "port": 12345,
    "type": "socks5",
    "username": "",
    "password": "",
    "tls": false,
    "skip-cert-verify": true,
    "udp": true,
    "dialer-proxy": "🚀 节点选择"
}];

const DirectDomains = [
    "apphot.cc",
    "wycad.com"
];

const serviceDefinitions = [
    {
        id: "games",
        name: "国外游戏平台国区分流",
        targetGroup: "🛤️ 自定义直连",
        position: "top",
        ruleSets: [{
            id: "games",
            url: `${ASSETS.rules.geosite}/category-games-!cn@cn.mrs`,
            path: "./ruleset/geo/games.mrs"
        }]
    },
    {
        id: "ads",
        name: "🛑 广告过滤",
        type: "reject",
        icon: `${ASSETS.icons}/block.svg`,
        ruleSets: [{
            id: "ads",
            url: `${ASSETS.rules.waster}/clash-ads-reject.mrs`,
            path: "./ruleset/custom/ads.mrs",
        }]
    },
    {
        id: "ai",
        name: "🧠 AI 服务",
        icon: `${ASSETS.icons}/chatgpt.svg`,
        excludeCN: true,
        ruleSets: [{
            id: "ai_chat",
            url: `${ASSETS.rules.geosite}/category-ai-chat-!cn.mrs`,
            path: "./ruleset/geo/ai.mrs"
        }]
    },
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
    {
        id: "google",
        name: "🔍 谷歌服务",
        icon: `${ASSETS.icons}/google.svg`,
        ruleSets: [{
            id: "google",
            url: `${ASSETS.rules.geosite}/google.mrs`,
            path: "./ruleset/geo/google.mrs"
        }]
    },
    {
        id: "entertainment",
        name: "🎬 国外娱乐",
        icon: `${ASSETS.icons}/youtube.svg`,
        ruleSets: [{
            id: "entertainment",
            url: `${ASSETS.rules.geosite}/category-entertainment.mrs`,
            path: "./ruleset/geo/entertainment.mrs"
        }]
    },
    {
        id: "communication",
        name: "💬 通讯软件",
        icon: `${ASSETS.icons}/telegram.svg`,
        ruleSets: [
            {
                id: "communication",
                url: `${ASSETS.rules.geosite}/category-communication.mrs`,
                path: "./ruleset/geo/communication.mrs"
            },
            {
                id: "telegramcidr",
                url: `${ASSETS.rules.geoip}/telegram.mrs`,
                path: "./ruleset/geo/tg-ip.mrs",
                behavior: "ipcidr"
            }
        ]
    },
    {
        id: "social_media",
        name: "👥 社交媒体",
        icon: `${ASSETS.icons}/facebook.svg`,
        ruleSets: [
            {
                id: "social_media",
                url: `${ASSETS.rules.geosite}/category-social-media-!cn.mrs`,
                path: "./ruleset/geo/social.mrs"
            }
        ]
    },
    {
        id: "microsoft_cn",
        name: "🪟 微软中国",
        icon: `${ASSETS.icons}/microsoft.svg`,
        preferDirect: true,
        ruleSets: [{
            id: "microsoft_cn",
            url: `${ASSETS.rules.geosite}/microsoft@cn.mrs`,
            path: "./ruleset/geo/ms-cn.mrs"
        }]
    },
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
    {
        id: "apple_cn",
        name: "🍎 苹果中国",
        icon: `${ASSETS.icons}/apple.svg`,
        preferDirect: true,
        ruleSets: [{
            id: "apple_cn",
            url: `${ASSETS.rules.geosite}/apple@cn.mrs`,
            path: "./ruleset/geo/apple-cn.mrs"
        }]
    },
    {
        id: "apple",
        name: "🍏 苹果国际",
        icon: `${ASSETS.icons}/apple.svg`,
        ruleSets: [{
            id: "apple",
            url: `${ASSETS.rules.geosite}/apple.mrs`,
            path: "./ruleset/geo/apple.mrs"
        }]
    },
    {
        id: "pikpak",
        name: "📥 PikPak",
        icon: `${ASSETS.icons}/pikpak.svg`,
        ruleSets: [{
            id: "pikpak",
            url: `${ASSETS.rules.geosite}/pikpak.mrs`,
            path: "./ruleset/geo/pikpak.mrs"
        }]
    },
    {
        id: "bybit",
        name: "📈 Bybit",
        icon: `${ASSETS.icons}/bybit.svg`,
        ruleSets: [{
            id: "bybit",
            url: `${ASSETS.rules.geosite}/bybit.mrs`,
            path: "./ruleset/geo/bybit.mrs"
        }]
    },
    {
        id: "applications",
        name: "代理软件直连",
        targetGroup: "🎯 全局直连",
        position: "bottom",
        ruleSets: [{
            id: "applications",
            url: `${ASSETS.rules.waster}/applications.yaml`,
            path: "./ruleset/custom/applications.yaml",
            behavior: "classical",
            format: "yaml"
        }]
    }
];

const basicRuleSets = [
    {
        id: "private",
        url: `${ASSETS.rules.geosite}/private.mrs`,
        path: "./ruleset/geo/priv.mrs"
    },
    {
        id: "tld_not_cn",
        url: `${ASSETS.rules.geosite}/tld-!cn.mrs`,
        path: "./ruleset/geo/no-cn.mrs"
    },
    {
        id: "cncidr",
        url: `${ASSETS.rules.geoip}/cn.mrs`,
        path: "./ruleset/geo/cn-ip.mrs",
        behavior: "ipcidr"
    },
    {
        id: "lancidr",
        url: `${ASSETS.rules.geoip}/private.mrs`,
        path: "./ruleset/geo/lan-ip.mrs",
        behavior: "ipcidr"
    },
    {
        id: "cn",
        url: `${ASSETS.rules.geosite}/cn.mrs`,
        path: "./ruleset/geo/cn.mrs"
    },
    {
        id: "gfw",
        url: `${ASSETS.rules.geosite}/gfw.mrs`,
        path: "./ruleset/geo/gfw.mrs"
    },
    {
        id: "geolocation_not_cn",
        url: `${ASSETS.rules.geosite}/geolocation-!cn.mrs`,
        path: "./ruleset/geo/geo-no-cn.mrs"
    }
];

function main(config) {
    if (!config) return config;

    const originalProxies = config?.proxies ? [...config.proxies] : [];
    const originalProviders = config?.["proxy-providers"] || {};

    config["unified-delay"] = true;
    config["tcp-concurrent"] = true;
    config["global-client-fingerprint"] = "chrome";
    config['find-process-mode'] = 'strict';
    config['geodata-loader'] = 'memconservative';
    config['keep-alive-interval'] = 1800;

    config['geodata-mode'] = false;
    config['geo-auto-update'] = false;

    config['ntp'] = {
        enable: true,
        'write-to-system': false,
        'dialer-proxy': "🎯 全局直连",
        server: 'ntp.aliyun.com',
    };

    if (!config['tun']) config['tun'] = {};
    config['tun']['dns-hijack'] = ['any:53', 'tcp://any:53'];
    config['tun']['route-exclude-address'] = skipIps;

    config["dns"] = {
        "enable": true,
        "listen": "0.0.0.0:1053",
        // "ipv6": true,
        "prefer-h3": true,
        "respect-rules": true,
        "enhanced-mode": "fake-ip",
        "fake-ip-range": "198.18.0.1/16",
        "fake-ip-filter": [
            "RULE-SET,private",
            "+.msftconnecttest.com",
            "+.msftncsi.com",
            "+.stun.*.*",
            "+.stun.*",
            "+.work.weixin.qq.com",
            "+.exmail.qq.com"
        ],
        "default-nameserver": [
            "223.5.5.5",
            "223.6.6.6",
            "119.29.29.29",
            "114.114.114.114",
            "180.76.76.76",
            "1.2.4.8"
        ],
        "nameserver": foreignNameservers,
        "proxy-server-nameserver": domesticNameservers,
        "direct-nameserver": domesticNameservers,
        "nameserver-policy": {
            "rule-set:cn": domesticNameservers,
            "rule-set:private": domesticNameservers,
            "rule-set:apple_cn": domesticNameservers,
            "rule-set:microsoft_cn": domesticNameservers,
            "rule-set:google": foreignNameservers,
            "rule-set:gfw": foreignNameservers
        },
        "fallback-filter": {
            "geoip": false,
            "ipcidr": ["240.0.0.0/4", "127.0.0.1/32", "10.0.0.0/8", "192.168.0.0/16"]
        }
    };

    config['sniffer'] = {
        enable: true,
        'force-dns-mapping': true,
        'parse-pure-ip': false,
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
        'force-domain': [
            'rule-set:google',
            'rule-set:entertainment',
            'rule-set:communication',
            'rule-set:social_media'
        ],
        'skip-domain': [
            'Mijia Cloud',
            'rule-set:cn',
            'rule-set:apple_cn',
            'rule-set:microsoft_cn'
        ]
    };

    const processedProxies = originalProxies.map(p => (p && p.server) ? {
        ...p,
        udp: true
    } : null).filter(Boolean);

    const checkHighMultiplier = (name) => {
        const match = name.match(/(?:x|X|倍|倍率)\s*((?:0\.\d+|[1-9]\d*(?:\.\d+)?))/);
        return match && parseFloat(match[1]) > 3.0;
    };

    const regionGroups = {};
    regionDefinitions.forEach(r => regionGroups[r.name] = {
        ...r,
        proxies: []
    });
    const otherRegionName = '🇺🇳 其它地区';
    regionGroups[otherRegionName] = {
        name: otherRegionName,
        proxies: [],
        icon: `${ASSETS.icons}/flags/un.svg`
    };

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

    const groupBase = {
        "interval": 600,
        "timeout": 3000,
        "url": "https://www.gstatic.com/generate_204",
        "lazy": true,
        "max-failed-times": 3
    };
    const generatedRegionGroups = [];
    Object.values(regionGroups).filter(r => r.proxies.length > 0).forEach(r => {
        const autoName = `⚡ 自动选择 ${r.name}`;
        generatedRegionGroups.push({
            ...groupBase,
            "name": autoName,
            "type": "url-test",
            "tolerance": 50,
            "proxies": r.proxies,
            "hidden": true
        });
        generatedRegionGroups.push({
            ...groupBase,
            "name": r.name,
            "type": "select",
            "proxies": [autoName, ...r.proxies],
            "icon": r.icon
        });
    });
    const regionGroupNames = generatedRegionGroups.filter(g => g.type === "select").map(g => g.name);
    const validLandingNodes = landingNodeProxies.filter(p => p.server);
    config["proxies"] = [...processedProxies, ...validLandingNodes];

    const landingNodeNames = validLandingNodes.map(p => p.name);
    const escapeForRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const excludeLandingFilter = landingNodeNames.length > 0 ? `^(?:${landingNodeNames.map(escapeForRegExp).join('|')})$` : null;
    const groupsToExcludeLandingNodes = ["🚀 节点选择", "⚡ 延迟选优", "🚨 故障转移", "⚖️ 负载均衡(散列)", "🎡 负载均衡(轮询)"];

    const generatedRuleProviders = {};
    const generatedFunctionalGroups = [];
    
    const topRules = [];
    const middleRules = [];
    const bottomRules = [];

    const commonProxies = ["🛡️ 模式选择", "🗺️ 地区选择", "🚀 节点选择", "🛬 落地节点", "⚡ 延迟选优", "🚨 故障转移", "🎯 全局直连"];
    const directFirstProxies = ["🎯 全局直连", "🛡️ 模式选择", "🗺️ 地区选择", "🚀 节点选择", "⚡ 延迟选优", "🚨 故障转移"];

    basicRuleSets.forEach(set => {
        generatedRuleProviders[set.id] = createRuleProvider(
            set.url, 
            set.path, 
            set.behavior,
            set.format
        );
    });

    serviceDefinitions.forEach(svc => {
        svc.ruleSets.forEach(set => {
            generatedRuleProviders[set.id] = createRuleProvider(
                set.url, 
                set.path, 
                set.behavior, 
                set.format
            );
        });

        if (!svc.targetGroup) {
            let proxies = svc.preferDirect ? directFirstProxies : commonProxies;
            if (svc.type === "reject") proxies = ["REJECT", "DIRECT"];

            const groupObj = {
                ...groupBase,
                name: svc.name,
                type: "select",
                proxies: proxies,
                icon: svc.icon
            };

            let shouldIncludeAll = true;
            if (svc.includeAll !== undefined) {
                shouldIncludeAll = svc.includeAll;
            } else if (svc.type === "reject") {
                shouldIncludeAll = false;
            }

            if (shouldIncludeAll) {
                groupObj["include-all"] = true;
            }

            if (svc.excludeCN) {
                groupObj["exclude-filter"] = "(?i)(^|[^a-z])(港|hk|hongkong|澳|macao|俄|ru|russia|cn|china)([^a-z]|$)";
            }

            generatedFunctionalGroups.push(groupObj);
        }

        const target = svc.targetGroup || svc.name;
        
        svc.ruleSets.forEach(set => {
            const noRes = set.behavior === 'ipcidr' ? ",no-resolve" : "";
            const ruleLine = `RULE-SET,${set.id},${target}${noRes}`;
            
            if (svc.position === "top") {
                topRules.push(ruleLine);
            } else if (svc.position === "bottom") {
                bottomRules.push(ruleLine);
            } else {
                middleRules.push(ruleLine);
            }
        });
    });

    const groupDefinitions = [{
            name: "🛡️ 模式选择",
            type: "select",
            proxies: ["🚀 节点选择", "🗺️ 地区选择", "🛬 落地节点", "🎯 全局直连"],
            icon: `${ASSETS.icons}/cloudflare.svg`,
            includeAll: false
        },
        {
            name: "🚀 节点选择",
            type: "select",
            proxies: ["⚡ 延迟选优", "🗺️ 地区选择", "🚨 故障转移", "⚖️ 负载均衡(散列)", "🎡 负载均衡(轮询)"],
            icon: `${ASSETS.icons}/adjust.svg`,
            includeAll: true
        },
        {
            name: "🗺️ 地区选择",
            type: "select",
            proxies: ["⚡ 延迟选优", ...regionGroupNames],
            condition: regionGroupNames.length > 0,
            icon: `${ASSETS.icons}/global.svg`,
            includeAll: false
        },
        {
            name: "🛬 落地节点",
            type: "select",
            proxies: landingNodeNames.length ? landingNodeNames : ["🚀 节点选择", "🎯 全局直连"],
            icon: `${ASSETS.icons}/openwrt.svg`,
            includeAll: false
        },
        {
            name: "⚡ 延迟选优",
            type: "url-test",
            tolerance: 50,
            icon: `${ASSETS.icons}/speed.svg`,
            includeAll: true
        },
        {
            name: "🚨 故障转移",
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
            name: "🎡 负载均衡(轮询)",
            type: "load-balance",
            strategy: "round-robin",
            icon: `${ASSETS.icons}/balance.svg`,
            includeAll: true
        },
        {
            name: "🎯 全局直连",
            type: "select",
            proxies: ["DIRECT"],
            icon: `${ASSETS.icons}/link.svg`,
            includeAll: false,
            hidden: true
        },
        {
            name: "🛤️ 自定义直连",
            type: "select",
            proxies: directFirstProxies,
            icon: `${ASSETS.icons}/unknown.svg`,
            includeAll: true
        },
        {
            name: "✈️ 自定义代理",
            type: "select",
            proxies: commonProxies,
            icon: `${ASSETS.icons}/openwrt.svg`,
            includeAll: true
        },
        {
            name: "🏁 漏网之鱼",
            type: "select",
            proxies: commonProxies,
            icon: `${ASSETS.icons}/fish.svg`,
            includeAll: true
        }
    ];

    const finalCoreGroups = groupDefinitions.filter(g => g.condition !== false).map(g => {
        const group = {
            ...groupBase,
            ...g
        };

        const shouldAppendLandingExclude = groupsToExcludeLandingNodes.includes(g.name) && excludeLandingFilter;
        const currentExclude = g.exclude || "";

        let finalFilter = currentExclude;
        if (shouldAppendLandingExclude) {
            finalFilter = currentExclude ? `(${currentExclude})|(${excludeLandingFilter})` : excludeLandingFilter;
        }

        if (finalFilter && finalFilter !== "") {
            group["exclude-filter"] = finalFilter;
        }

        if (g.includeAll === true) {
            group["include-all"] = true;
        }

        delete group.includeAll;
        delete group.condition;
        delete group.exclude;

        return group;
    });

    const finalRules = [
        "DOMAIN-SUFFIX,shuzilm.cn,🛡️ 模式选择",
        ...topRules,
        ...middleRules,
        "PROCESS-NAME,tv.danmaku.bili,📺 哔哩哔哩",
        "DOMAIN-SUFFIX,immersivetranslate.com,✈️ 自定义代理",
        // "DOMAIN-SUFFIX,bing.com,✈️ 自定义代理",
        ...DirectDomains.map(d => `DOMAIN-SUFFIX,${d},DIRECT`),
        "RULE-SET,private,🎯 全局直连",
        "RULE-SET,cn,🎯 全局直连",
        "RULE-SET,gfw,🛡️ 模式选择",
        "RULE-SET,tld_not_cn,🛡️ 模式选择",
        "RULE-SET,lancidr,🎯 全局直连,no-resolve",
        "RULE-SET,cncidr,🎯 全局直连,no-resolve",
        ...bottomRules,
        "MATCH,🏁 漏网之鱼"
    ];

    config["rule-providers"] = generatedRuleProviders;
    config["proxy-groups"] = [
        ...finalCoreGroups,
        ...generatedFunctionalGroups,
        ...generatedRegionGroups
    ];
    config["rules"] = finalRules;

    config["proxy-providers"] = {
        ...originalProviders,
        /* "p1": {
          "type": "http",
          "url": "https://google.com",
          "interval": 86400,
          "proxy": "🛡️ 模式选择",
          "override": { 
            "additional-prefix": "p1 |"
          }
        }
        */
    };

    return config;
}
