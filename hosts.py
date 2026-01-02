#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import urllib.request
import os
import shutil
from concurrent.futures import ThreadPoolExecutor

OUTPUT_FILE = "ads-rule-hosts.txt" 
CACHE_DIR = "download_cache"
HEADER_TAG = "# Power by Waster"

URLS = [
    "https://anti-ad.net/domains.txt",
    "https://anti-ad.net/adguard.txt",
    "https://anti-ad.net/easylist.txt"
]

def download_file(url, index):
    """并发下载"""
    if not os.path.exists(CACHE_DIR):
        os.makedirs(CACHE_DIR, exist_ok=True)
    filename = os.path.join(CACHE_DIR, f"list_{index}.txt")
    print(f"[-] [下载中] {url}")
    try:
        # 添加 User-Agent 防止被拦截
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=30) as response:
            with open(filename, 'wb') as f:
                f.write(response.read())
        print(f"[v] [下载完成] {url}")
        return filename
    except Exception as e:
        print(f"[x] [下载失败] {url}: {e}")
        return None

def main():
    # 1. 下载
    print("=== Step 1: 并发下载订阅 ===")
    files = []
    # 使用线程池并发下载
    with ThreadPoolExecutor(max_workers=5) as executor:
        futures = {executor.submit(download_file, url, i): i for i, url in enumerate(URLS)}
        for future in futures:
            if future.result(): files.append(future.result())

    # 2. 分类处理容器
    top_lines = set()      # 127.0.0.1 等
    middle_lines = set()   # 0.0.0.0 / :: 屏蔽规则
    bottom_lines = set()   # ::1 等 IPv6 本地回环
    
    # 统计计数器
    raw_count = 0

    print("\n=== Step 2: 解析、统计与转换 ===")
    
    for filepath in files:
        try:
            with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                for line in f:
                    line = line.strip()
                    if not line or line.startswith(('!', '#', '[', '@@')): continue

                    parts = line.split()
                    
                    # --- A. 识别原生 Hosts 格式 ---
                    if len(parts) >= 2 and ('.' in parts[0] or ':' in parts[0]):
                        ip = parts[0]
                        clean_line = line.split('#')[0].strip()

                        # 计数
                        raw_count += 1

                        if ip == "0.0.0.0" or ip == "::":
                            middle_lines.add(clean_line)
                        elif ':' in ip:
                            bottom_lines.add(clean_line)
                        else:
                            top_lines.add(clean_line)
                        continue

                    # --- B. 转换 ABP / 纯域名 ---
                    domain = ""
                    if line.startswith('||'):
                        domain = line[2:].rstrip('^')
                    elif len(parts) == 1 and '.' in line:
                        domain = line
                    
                    if domain and '/' not in domain and '*' not in domain:
                        domain = domain.split('#')[0].strip()
                        
                        # 生成双栈规则 (计数 +2)
                        v4_rule = f"0.0.0.0 {domain}"
                        v6_rule = f":: {domain}"
                        
                        raw_count += 2
                        
                        middle_lines.add(v4_rule)
                        middle_lines.add(v6_rule)

        except Exception as e:
            print(f"[!] 读取文件出错: {filepath} -> {e}")

    # 计算去重后的总数
    final_count = len(top_lines) + len(middle_lines) + len(bottom_lines)

    print(f"[-] 原始提取行数: {raw_count}")
    print(f"[-] 去重后总行数: {final_count}")
    print(f"[-] 重复规则数量: {raw_count - final_count}")

    # 3. 排序与合并写入
    print("\n=== Step 3: 按指定顺序写入文件 ===")
    
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        # A. 开头签名
        f.write(f"{HEADER_TAG}\n\n")
        
        # B. 头部 (Top Lines)
        f.write("# [Custom IPv4 / Localhost]\n")
        for line in sorted(top_lines):
            f.write(f"{line}\n")
        f.write("\n")

        # C. 中部 (Blocklist)
        f.write("# [Blocklist / 0.0.0.0 & ::]\n")
        for line in sorted(middle_lines):
            f.write(f"{line}\n")
        f.write("\n")

        # D. 尾部 (Bottom Lines)
        f.write("# [Custom IPv6 / Loopback]\n")
        for line in sorted(bottom_lines):
            f.write(f"{line}\n")
        f.write("\n")
        
        # E. 结尾签名
        f.write(f"{HEADER_TAG}\n")

    # 清理
    if os.path.exists(CACHE_DIR): shutil.rmtree(CACHE_DIR)
    print(f"[完成] 文件已保存为: {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
