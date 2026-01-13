import requests
import yaml
import pytz
from datetime import datetime
import os
import platform

# 全局配置
OUTPUT_FILE = "applications.yaml"
SOURCE_URL = "https://raw.githubusercontent.com/Loyalsoldier/clash-rules/release/applications.txt"

# 新增代理软件进程及包名
CUSTOM_PROCESSES = [
    "com.follow.clash",       # FlClash 安卓
]

def fetch_and_merge_rules(url, extra_list):
    unique_rules = set()
    print(f"info: 正在获取远程 applications 规则...")
    try:
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        content = response.text
        # 清洗并提取内容
        for line in content.splitlines():
            clean_line = line.strip().strip("-").strip().strip("'").strip('"')
            # 仅保留有效的规则，排除 payload 声明和注释
            if "PROCESS-NAME" in clean_line and not clean_line.startswith("#") and "payload" not in clean_line:
                unique_rules.add(clean_line)
        # 添加自定义包名
        for p in extra_list:
            unique_rules.add(f"PROCESS-NAME,{p}")
        print(f"success: 已处理 {len(unique_rules)} 条进程规则")
    except Exception as e:
        print(f"error: 获取远程规则失败: {e}")
        # 失败时至少保留自定义的
        for p in extra_list: unique_rules.add(f"PROCESS-NAME,{p}")
    return unique_rules

def generate_output(rules, output_file):
    sorted_rules = sorted(list(rules))
    tz = pytz.timezone('Asia/Shanghai')
    current_time = datetime.now(tz).strftime('%Y-%m-%d %H:%M:%S UTC+8')
    header = f"# Title: Waster Proxy Applications Skip Rule\n# Update: {current_time}\n# Description: Process-based bypass rules."
    
    try:
        with open(output_file, 'w', encoding='utf8') as f:
            f.write(header + "\n\npayload:\n")
            for rule in sorted_rules:
                f.write(f"  - '{rule}'\n")
        print(f"success: {output_file} 已生成")
    except IOError as e:
        print(f"error: 写入文件失败: {e}")

if __name__ == "__main__":
    rule_set = fetch_and_merge_rules(SOURCE_URL, CUSTOM_PROCESSES)
    generate_output(rule_set, OUTPUT_FILE)