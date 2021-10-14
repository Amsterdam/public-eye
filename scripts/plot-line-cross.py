import matplotlib.pyplot as plt
import numpy as np
from datetime import datetime
import matplotlib.font_manager as fm
import seaborn as sns
from tempfile import NamedTemporaryFile
from urllib.request import urlopen
import argparse

parser = argparse.ArgumentParser(description='Parse .')
parser.add_argument('filename', type=str, help='File name of line cross predictions')
parser.add_argument('output_filename', type=str, help='Output file (should be .png)', default='line-cross-plot.png')
args = parser.parse_args()


github_url = 'https://github.com/google/fonts/blob/master/apache/roboto/Roboto%5Bwdth%2Cwght%5D.ttf'

url = github_url + '?raw=true'  # You want the actual file, not some html

response = urlopen(url)
f = NamedTemporaryFile(delete=False, suffix='.ttf')
f.write(response.read())
f.close()
prop = fm.FontProperties(fname=f.name)

forward_counts, backward_counts, timestamps = [], [], []

use_count = 20
with open(args.filename) as f:
    for idx, line in enumerate(f):
        if idx == 0: continue

        splitted = line.replace('\n', '').split(',')

        dt = datetime.fromtimestamp(int(splitted[0]) / 1000)
        timestamps.append(dt.strftime('%H:%M'))
        forward_counts.append(int(splitted[1]))
        backward_counts.append(int(splitted[-1]))

        if use_count == idx:
            break

w = 0.45

ax = plt.subplot(111)
l1 = ax.bar([e - (w / 2) for e in np.arange(len(timestamps))], forward_counts, width=w, tick_label=timestamps, label='Forward Count', color='#1976d2')
l2 = ax.bar([e + (w / 2) for e in np.arange(len(timestamps))], backward_counts, width=w, tick_label=timestamps, label='Backward Count', color='#dc004e')
ax.xaxis_date()
ax.legend()
ax.autoscale(tight=True)
ax.set_xticklabels(timestamps, rotation = 45, ha="right", fontproperties=prop)
ax.set_title('Line crossed at the Vondel Park', fontproperties=prop)
plt.savefig(args.output_filename, dpi=500)

print('ding dong')