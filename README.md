# SCNU_pdf2ics

<img width="314" height="240" src="./But_I_DONT_HAVE_A_CAT.jpg"/>

将华南师范大学教务系统输出的列表形式pdf转为ics文件

[demo](https://lraty-li.github.io/)

[flutter版](https://github.com/lraty-li/SCNU-Jwxt-Pdf2Ics-flutter)

## 已知问题

- 事件提醒无法正常工作
- 过长导致换行的课程名只会提取最后一行
- 无法处理列表版三行课程详情（flutter版进行了简单处理)

## TODO

- CDN无法正常工作时替换为本地文件
- 小程序版本。
- 询问是否愿意分享课室。

## 感谢

- [课程表](https://github.com/iscnu/scnu-schedule-ical-jwxt)
- [pdf2json](https://github.com/modesty/pdf2json) 解析pdf并提取出位置信息。
- [ics.js](https://github.com/nwcell/ics.js)生成ics文件。
- [pdf.js](https://github.com/mozilla/pdf.js) 解析pdf。
- [FileSaver.js](https://github.com/eligrey/FileSaver.js/)保存ics文件。
- [ical-generator](https://github.com/sebbo2002/ical-generator)生成ics文件。
- [Day.js](https://github.com/iamkun/dayjs)替换moment.js ，减小包体积。
- 感谢[大佬](https://github.com/Okami-2)在我摸得正欢的时候突然发来整理pdf数据的JSON2Array.js。
