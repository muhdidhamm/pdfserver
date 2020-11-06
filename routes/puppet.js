let express = require('express');
let PDFMerge = require('pdfmerge')
let router = express.Router();
let axios = require('axios').default
const querystring = require('querystring');

const puppeteer = require('puppeteer');

async function init(html, config){
    console.log(config)
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    // await page.setViewport({deviceScaleFactor: 0});
    await page.emulateMediaType('print');
    // await page.addStyleTag({ content: '@page { size: auto; }' })
    await page.setContent(html, {waitUntil:'networkidle2'})
    let size = config_size(config)
    const screenshotpage = await page.pdf({preferCSSPageSize: true ,printBackground: false, ...size , margin: {
            left: `${config['margin-left']}px`,
            right: `${config['margin-right']}px`,
            top: `${config['margin-top']}px`,
            bottom: `${config['margin-bottom']}px`
        }
    })
    // await page.goto('https://go.setiaawan.com/printview?doctype=Property%20Sales&name=BBSAP%2F2D%2FSTW%2FCH-IL-PLOT%200567-73152&format=Sales%20A%2FC%20Statement&no_letterhead=0&_lang=en');
    // let screenshotpage = await page.screenshot({fullPage: true, quality: 100, type: "jpeg"});
    // let bugger = await screenshotpage.pdf({format: "A4", preferCSSPageSize: true,printBackground: true})
 
    await browser.close();
    // res.set('Content-Type', 'image/png');
    // res.set('Content-Type', 'application/pdf')
    // res.send(screenshotpage);
    return screenshotpage
}

function config_size(config){
    let size

    if ((config.width == undefined || config.width == null)){
        size = {
            "format": "A4"
        }
    } else {
        size = {
            width : config.width,
            height: config.height
        }
    }

    return size
}

router.get('/singlePdf', async(req,res,next) => {
    // Single PDF Generator

    /*  1st Iteration
        - Generate a random file name
        - Fetch html object from api {List}
        - Feed the html object to puppeteer
        - Create PDF and save it using the file name generated
        - Send the filename to the client
    */

    // Generate random file name
    let filename = `${Math.random().toString(36).substr(3)}.pdf`
    console.log(filename)
    let html_template = req.body.html

    // let pdf_config = req.body.config

    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.emulateMediaType('print');
    await page.setContent(html_template, {waitUntil:'networkidle2'})
    await page.pdf({ preferCSSPageSize: true,printBackground: false, width: '8.5in', height: '5.5in' , margin: {
        left: '0px',
        right: '0px',
        top: '10px',
        bottom: '0px'
    },pageRanges: '1', path: `./${filename}`})

    res.send(filename).status(200)
})

router.get('/MultiplePdf', async(req,res,next) => {
    // Single PDF Generator

    /*  1st Iteration
        - Generate a random file name
        - Fetch html object from api {List}
        - Feed the html object to puppeteer
        - Create PDF and save it using the file name generated
        - Send the filename to the client
    */
    let listoffile = []
    let i = 10;
    let mainFileName = 'merged.pdf'
    const browser = await puppeteer.launch({
        args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage"
            ],
        headless: true,
    });
    const page = await browser.newPage();
    await page.emulateMediaType('print');

    for(i=0; i<100; i++){
        
        // Generate random file name
        let filename = `${Math.random().toString(36).substr(3)}.pdf`
        console.log(filename)
        let html_template = req.body.html

        // let pdf_config = req.body.config
        
        await page.setContent(html_template, {waitUntil:'networkidle2'})
        await page.pdf({ preferCSSPageSize: true,printBackground: false, width: '8.5in', height: '5.5in' , margin: {
            left: '0px',
            right: '0px',
            top: '10px',
            bottom: '0px'
        },pageRanges: '1', path: `./${filename}`})

        listoffile.push(filename)
    }
    
    PDFMerge(listoffile, mainFileName).then(data => {
        console.log(data)
    }).catch(error => {
        console.log(error)
    })

    res.send(mainFileName).status(200)
})

async function getDataFromServer(document_name, print_format,document_type){
    let instance = await axios({
        method: 'GET',
        url: 'http://192.168.10.28/api/method/property_sales.property_sales.doctype.property_sales.test_pdf_template.create_html_template',
        headers: { 'Authorization': `Basic ${Buffer.from(`95b29446e276cd9:7a72b9adb3c011e`).toString('base64')}`, 'Content-Type': 'application/x-www-form-urlencoded'},
        data: querystring.stringify({
            print_format: print_format,
            property_name: document_name,
            property_doctype: document_type
        })
    }).catch(error => {
        console.log(error)
    })

    if (instance.status = 200){
        return {
            "code": 200,
            "data": instance.data
        }
    } else {
        console.log(error)
        return {
            "code": 400,
            "data": "Failed"
        }
    }
}

// async function generateAccessToken(){

// }

router.get('/', async(req, res, next) => {
    
    const document_name = req.query.name
    const print_format = req.query.format
    const document_type = req.query.doctype

    // Get data first then do the init
    await getDataFromServer(document_name,print_format,document_type).then(async data => {
        if (data.code == 200){
            // Unserialize data
            let json_data = JSON.parse(data.data.message)
            console.log(json_data)
            await init(json_data.final_template,json_data.print_config).then(data => {
                res.set('Content-Type', 'application/pdf')
                res.send(data);
            })
        }
    })
    
    // await init(res).then(data => {
    //     console.log(data)
    // }).catch(error => {
    //     console.log(error)
    // })
})

module.exports = router