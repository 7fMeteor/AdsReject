import requests
import yaml
import pytz
from datetime import datetime

# 源链接
urls = [
    "https://fastly.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/reject.txt",
    "https://raw.githubusercontent.com/TG-Twilight/AWAvenue-Ads-Rule/main/Filters/AWAvenue-Ads-Rule-Clash.yaml",
    "https://anti-ad.net/clash.yaml"
]

# 使用集合(set)自动去重
unique_rules = set()

def fetch_rules():
    print(">>> 开始获取规则...")
    for url in urls:
        try:
            print(f"正在下载: {url}")
            response = requests.get(url, timeout=30)
            response.raise_for_status()
            content = response.text

            # --- 情况 A: 处理 YAML 格式 (针对 AWAvenue 和 Anti-AD) ---
            # 只要内容里能解析出 payload 列表，就直接提取列表里的完整字符串
            try:
                data = yaml.safe_load(content)
                if isinstance(data, dict) and 'payload' in data:
                    print(f"  - 识别为 YAML，提取 payload 原文...")
                    for rule in data['payload']:
                        # 去除首尾空格，保留规则原貌（如 'DOMAIN,example.com,REJECT'）
                        clean_rule = rule.strip()
                        if clean_rule:
                            unique_rules.add(clean_rule)
                    continue # 处理成功，跳过后续文本处理逻辑
            except yaml.YAMLError:
                pass # 解析失败则尝试作为普通文本处理
            
            # --- 情况 B: 处理纯文本格式 (针对 Loyalsoldier) ---
            print(f"  - 识别为文本，按行提取...")
            lines = content.splitlines()
            for line in lines:
                line = line.strip()
                # 排除空行和注释
                if line and not line.startswith('#'):
                    unique_rules.add(line)
                
        except Exception as e:
            print(f"!!! 下载或解析失败 {url}: {e}")

def generate_output():
    # 排序，保证每次生成的顺序一致
    sorted_rules = sorted(list(unique_rules))
    total_count = len(sorted_rules)
    
    # 获取 UTC+8 时间
    tz = pytz.timezone('Asia/Shanghai')
    current_time = datetime.now(tz).strftime('%Y-%m-%d %H:%M:%S UTC+8')

    # 构建头部信息
    header = f"""#Title: Waster Ads Rule
#--------------------------------------
#Total rules: {total_count}
#Update time: {current_time}
"""

    output_file = "clash-ads-reject.yaml"
    
    # 写入文件
    with open(output_file, 'w', encoding='utf8') as f:
        f.write(header)
        f.write("payload:\n")
        for rule in sorted_rules:
            f.write(f"  - '{rule}'\n")

    print(f">>> 成功生成文件: {output_file}, 包含规则数: {total_count}")

if __name__ == "__main__":
    fetch_rules()
    generate_output()
