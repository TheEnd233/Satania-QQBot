module.exports = function (recvObj, client) {
    if ((/搜.*图/).test(recvObj.params.content)) {
        const imgURL = getFirstImageURL(recvObj.params.content);
        if (!imgURL) {
            client.send(JSON.stringify({
                id: uuid(),
                method: "sendMessage",
                params: {
                    type: recvObj.params.type,
                    group: recvObj.params.group || '',
                    qq: recvObj.params.qq || '',
                    content: '欧尼酱搜图的话请至少要一张图哦~'
                }
            }));
        } else {
            SauceNAO(imgURL, recvObj, client);
        }
        return true;
    }
    return false;
}

async function SauceNAO(url, recvObj, client) {
    let saucenaoObj;
    try {
        saucenaoObj = await new Promise((resolve, reject) => {
            request.get(encodeURI(`https://saucenao.com/search.php?db=999&output_type=2&numres=1&api_key=${secret.SauceNAO_API_KEY}&url=${url}`),
                (err, res, body) => {
                    if (err) {
                        reject();
                        return;
                    }
                    let result;
                    try {
                        result = JSON.parse(body);
                    } catch {
                        reject();
                        return;
                    }
                    if (result.results)
                        console.log('SauceNAO API:', JSON.stringify(result.results, null, 2));
                    resolve(result);
                });
        });
    } catch {
        client.send(JSON.stringify({
            id: uuid(),
            method: "sendMessage",
            params: {
                type: recvObj.params.type,
                group: recvObj.params.group || '',
                qq: recvObj.params.qq || '',
                content: '欧尼酱搜索出错了~喵'
            }
        }));
        return;
    }
    if (!saucenaoObj.results) {
        client.send(JSON.stringify({
            id: uuid(),
            method: "sendMessage",
            params: {
                type: recvObj.params.type,
                group: recvObj.params.group || '',
                qq: recvObj.params.qq || '',
                content: '欧尼酱对不起，没有找到你要的~'
            }
        }));
        return;
    }

    client.send(JSON.stringify({
        id: uuid(),
        method: "sendMessage",
        params: {
            type: recvObj.params.type,
            group: recvObj.params.group || '',
            qq: recvObj.params.qq || '',
            content: `[QQ:at=${recvObj.params.qq}]` +
                ' 欧尼酱是不是你想要的内个~\r\n' +
                `相似度：${saucenaoObj.results[0].header.similarity}%\r\n` +
                ((saucenaoObj.results[0].data.title ||
                    saucenaoObj.results[0].data.jp_name ||
                    saucenaoObj.results[0].data.eng_name) ? `标题：${
                    saucenaoObj.results[0].data.title||
                    saucenaoObj.results[0].data.jp_name||
                    saucenaoObj.results[0].data.eng_name}\r\n` : '') +
                ((saucenaoObj.results[0].data.member_name ||
                    saucenaoObj.results[0].data.author_name ||
                    saucenaoObj.results[0].data.creator) ? `作者：${
                    saucenaoObj.results[0].data.member_name||
                    saucenaoObj.results[0].data.author_name||
                    saucenaoObj.results[0].data.creator}\r\n` : '') +
                `[QQ:pic=${saucenaoObj.results[0].header.thumbnail}]` +
                (saucenaoObj.results[0].data.ext_urls ? ('\r\n' + saucenaoObj.results[0].data.ext_urls[0]) : '')
        }
    }));
}

function getFirstImageURL(content) {
    const arr = content.match(/\[.*?\]/g);
    if (!_.isArray(arr)) return null;

    for (let i = 0; i < arr.length; i++) {
        const qq = arr[i].replace(/\[|\]/g, '').split('=');
        if (qq[0] == 'QQ:pic') {
            const iniPath = path.join(secret.tempPath, 'image', path.basename(qq[1], path.extname(qq[1])) + '.ini');
            const ini = fs.readFileSync(iniPath, 'utf8');
            return /^url=(.*)$/m.exec(ini)[1].trim();
        }
    }
}