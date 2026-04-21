const axios = require('axios');
const FormData = require('form-data');

/**
 * AI TEXT REPLACE ENGINE
 * Fungsi: Mengganti teks di dalam gambar menggunakan AI
 */

function genserial() {
    let s = '';
    for (let i = 0; i < 32; i++) s += Math.floor(Math.random() * 16).toString(16);
    return s;
}

async function upimage(filename) {
    const form = new FormData();
    form.append('file_name', filename);

    const res = await axios.post('https://api.imgupscaler.ai/api/common/upload/upload-image', form, {
        headers: {
            ...form.getHeaders(),
            'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36',
            origin: 'https://imgupscaler.ai',
            referer: 'https://imgupscaler.ai/'
        }
    });
    return res.data.result;
}

async function uploadtoOSS(putUrl, buffer, contentType) {
    const res = await axios.put(putUrl, buffer, {
        headers: { 'Content-Type': contentType },
        maxBodyLength: Infinity,
        maxContentLength: Infinity
    });
    return res.status === 200;
}

async function createJob(imgurl, originalteks, replacetext) {
    const form = new FormData();
    form.append('original_image_url', imgurl);
    form.append('original_text', originalteks);
    form.append('replace_text', replacetext);

    const res = await axios.post('https://api.magiceraser.org/api/magiceraser/v2/text-replace/create-job', form, {
        headers: {
            ...form.getHeaders(),
            'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36',
            'product-code': 'magiceraser',
            'product-serial': genserial(),
            origin: 'https://imgupscaler.ai',
            referer: 'https://imgupscaler.ai/'
        }
    });
    return res.data.result.job_id;
}

async function cekjob(jobId) {
    const res = await axios.get(`https://api.magiceraser.org/api/magiceraser/v1/ai-remove/get-job/${jobId}`, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36',
            origin: 'https://imgupscaler.ai',
            referer: 'https://imgupscaler.ai/'
        }
    });
    return res.data;
}

module.exports = function (app) {
    // Path: /tools/text-replace
    app.get("/tools/text-replace", async (req, res) => {
        const { url, find, replace } = req.query;

        if (!url || !find || !replace) {
            return res.status(400).json({ 
                status: false, 
                message: "Format salah! Butuh parameter: url, find, & replace." 
            });
        }

        try {
            // 1. Download gambar ke buffer
            const imgRes = await axios.get(url, { responseType: 'arraybuffer' });
            const buffer = Buffer.from(imgRes.data, 'binary');
            const contentType = imgRes.headers['content-type'] || 'image/jpeg';
            const filename = `image_${Date.now()}.${contentType.split('/')[1]}`;

            // 2. Upload ke Cloud Upscaler
            const uploadInfo = await upimage(filename);
            await uploadtoOSS(uploadInfo.url, buffer, contentType);

            // 3. Create AI Job
            const cdnUrl = 'https://cdn.imgupscaler.ai/' + uploadInfo.object_name;
            const jobId = await createJob(cdnUrl, find, replace);

            // 4. Polling Result
            let result;
            let attempts = 0;
            do {
                await new Promise(r => setTimeout(r, 3000));
                result = await cekjob(jobId);
                attempts++;
                if (attempts > 20) throw new Error("Timeout: AI terlalu lama memproses.");
            } while (!result.result || !result.result.output_url);

            res.status(200).json({
                status: true,
                result: {
                    job_id: jobId,
                    original_text: find,
                    replaced_with: replace,
                    output_url: result.result.output_url[0]
                }
            });

        } catch (err) {
            res.status(500).json({ status: false, error: err.message });
        }
    });
};
