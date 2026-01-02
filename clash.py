import requests
import yaml
import pytz
from datetime import datetime

# 全局配置
OUTPUT_FILE = "clash-ads-reject.yaml"
URLS = [
    "https://fastly.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/reject.txt",
    "https://raw.githubusercontent.com/TG-Twilight/AWAvenue-Ads-Rule/main/Filters/AWAvenue-Ads-Rule-Clash.yaml",
    "https://anti-ad.net/clash.yaml"
]

def fetch_rules(urls):
    """
    从远程源获取规则并去重
    支持 YAML payload 和 纯文本格式
    """
    unique_rules = set()
    print(f"info: 开始从 {len(urls)} 个源获取规则...")

    for url in urls:
        try:
            print(f"download: 正在下载 {url}")
            response = requests.get(url, timeout=30)
            response.raise_for_status()
            content = response.text

            # 策略 A: 尝试解析为 YAML (如 AWAvenue, Anti-AD)
            try:
                data = yaml.safe_load(content)
                if isinstance(data, dict) and 'payload' in data:
                    count_before = len(unique_rules)
                    for rule in data['payload']:
                        clean_rule = rule.strip()
                        # 基本校验：非空且非注释
                        if clean_rule and not clean_rule.startswith('#'):
                            unique_rules.add(clean_rule)
                    print(f"parsed: YAML 解析成功，新增 {len(unique_rules) - count_before} 条规则")
                    continue 
            except yaml.YAMLError:
                pass
            
            # 策略 B: 回退到纯文本处理 (如 Loyalsoldier)
            count_before = len(unique_rules)
            for line in content.splitlines():
                clean_line = line.strip()
                if clean_line and not clean_line.startswith('#'):
                    unique_rules.add(clean_line)
            print(f"parsed: 文本解析成功，新增 {len(unique_rules) - count_before} 条规则")
                
        except Exception as e:
            print(f"error: 处理 {url} 失败: {e}")

    return unique_rules

def generate_output(rules, output_file):
    """
    排序规则，生成元数据头部，写入文件
    """
    sorted_rules = sorted(list(rules))
    total_count = len(sorted_rules)
    
    # 获取 UTC+8 时间
    tz = pytz.timezone('Asia/Shanghai')
    current_time = datetime.now(tz).strftime('%Y-%m-%d %H:%M:%S UTC+8')

    # 构建头部信息
    header = f"""# Title: Waster Ads Rule
# Description: Combined and deduplicated ad-blocking rules for Clash Meta or Premium.
# --------------------------------------
# Total lines: {total_count}
# Update time: {current_time}
"""

    try:
        with open(output_file, 'w', encoding='utf8') as f:
            f.write(header + "\n")
            f.write("payload:\n")
            for rule in sorted_rules:
                f.write(f"  - '{rule}'\n")
        
        print(f"success: 文件已生成: {output_file}，共包含 {total_count} 条规则")
    except IOError as e:
        print(f"error: 写入文件失败: {e}")

if __name__ == "__main__":
    rules = fetch_rules(URLS)
    generate_output(rules, OUTPUT_FILE)
