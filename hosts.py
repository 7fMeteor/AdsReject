import urllib.request
import os
import shutil
import pytz
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor

# 全局配置
OUTPUT_FILE = "ads-rule-hosts.txt"
CACHE_DIR = "download_cache"
URLS = [
    "https://anti-ad.net/domains.txt",
    "https://raw.githubusercontent.com/7fMeteor/AdsReject/main/ads-rule-hosts.txt",
    "https://raw.githubusercontent.com/lingeringsound/10007/main/reward"
]

def download_source(url, index):
    """
    下载单个源文件到缓存目录
    """
    if not os.path.exists(CACHE_DIR):
        os.makedirs(CACHE_DIR, exist_ok=True)
        
    filename = os.path.join(CACHE_DIR, f"source_{index}.txt")
    print(f"[-] [下载中] {url}")
    
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=30) as response:
            with open(filename, 'wb') as f:
                f.write(response.read())
        print(f"[v] [下载完成] {url}")
        return filename
    except Exception as e:
        print(f"[x] [下载失败] {url}: {e}")
        return None

def process_files(file_paths):
    """
    解析下载的文件，提取域名并分类生成 Hosts 规则
    """
    top_lines = set()      # 自定义/本地回环
    middle_lines = set()   # 0.0.0.0 & :: 屏蔽
    bottom_lines = set()   # IPv6 回环
    
    raw_count = 0
    
    for filepath in file_paths:
        try:
            with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                for line in f:
                    line = line.strip()
                    # 忽略空行、注释和特殊规则
                    if not line or line.startswith(('!', '#', '[', '@@')):
                        continue

                    parts = line.split()
                    
                    # 识别标准 Hosts 语法
                    if len(parts) >= 2 and ('.' in parts[0] or ':' in parts[0]):
                        ip = parts[0]
                        clean_line = line.split('#')[0].strip()
                        raw_count += 1

                        if ip == "0.0.0.0" or ip == "::":
                            middle_lines.add(clean_line)
                        elif ':' in ip:
                            bottom_lines.add(clean_line)
                        else:
                            top_lines.add(clean_line)
                        continue

                    # 识别 ABP / 纯域名语法并转换
                    domain = ""
                    if line.startswith('||'):
                        domain = line[2:].rstrip('^')
                    elif len(parts) == 1 and '.' in line:
                        domain = line
                    
                    if domain and '/' not in domain and '*' not in domain:
                        domain = domain.split('#')[0].strip()
                        # 生成双栈规则
                        middle_lines.add(f"0.0.0.0 {domain}")
                        middle_lines.add(f":: {domain}")
                        raw_count += 2

        except Exception as e:
            print(f"[!] 读取文件出错: {filepath} -> {e}")
            
    print(f"info: 原始提取规则数: {raw_count}")
    return top, middle, bottom

def generate_output(top, middle, bottom, output_file):
    """
    写入最终 Hosts 文件并添加元数据头部
    """
    total_count = len(top) + len(middle) + len(bottom)
    
    tz = pytz.timezone('Asia/Shanghai')
    current_time = datetime.now(tz).strftime('%Y-%m-%d %H:%M:%S UTC+8')

    header = f"""# Title: Waster Ads Hosts
# Description: Modified hosts file for system-wide ad blocking.
# --------------------------------------
# Total lines: {total_count}
# Update time: {current_time}
"""

    try:
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(header + "\n")
            
            f.write("# [Custom IPv4 / Localhost]\n")
            f.write("\n".join(sorted(top)) + "\n\n")

            f.write("# [Blocklist / 0.0.0.0 & ::]\n")
            f.write("\n".join(sorted(middle)) + "\n\n")

            f.write("# [Custom IPv6 / Loopback]\n")
            f.write("\n".join(sorted(bottom)) + "\n")
            
        print(f"[完成] 文件已生成: {output_file}，去重后总行数: {total_count}")
    except IOError as e:
        print(f"[错误] 写入文件失败: {e}")
    finally:
        # 清理缓存
        if os.path.exists(CACHE_DIR):
            shutil.rmtree(CACHE_DIR)

if __name__ == "__main__":
    # 并发下载
    downloaded_files = []
    with ThreadPoolExecutor(max_workers=5) as executor:
        futures = {executor.submit(download_source, url, i): i for i, url in enumerate(URLS)}
        for future in futures:
            result = future.result()
            if result:
                downloaded_files.append(result)

    # 解析处理
    top, middle, bottom = process_files(downloaded_files)

    # 生成文件
    generate_output(top, middle, bottom, OUTPUT_FILE)
