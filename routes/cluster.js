// import { Cluster } from "puppeteer-cluster";
let Cluster = require("puppeteer-cluster")

class puppet_cluster{
    
    constructor(){
        this.cluster_instance = undefined
        this.start_cluster().then(data => {
            this.create_task()
        })
        
    }
    
    async start_cluster () {
        this.cluster_instance = await Cluster.Cluster.launch({
            concurrency : Cluster.Cluster.CONCURRENCY_PAGE,
            maxConcurrency : 20,
            puppeteerOptions : {
                args: [
                    "--no-sandbox",
                    "--disable-setuid-sandbox",
                    "--disable-dev-shm-usage",
                    "--disable-gpu"
                    ],
                headless: true
            },
            timeout: 120000
        })
    }

    async create_task() {
        this.cluster_instance.task(async ({page, data}) => {
            let size = this.config_size(data.config)
            await page.setContent(data.html_template, {waitUntil:'networkidle2'})
            await page.pdf({ preferCSSPageSize: true, printBackground: false, ...size , margin: {
                left: `${data.config['margin-left']}px`,
                right: `${data.config['margin-right']}px`,
                top: `${data.config['margin-top']}px`,
                bottom: `${data.config['margin-bottom']}px`
            },pageRanges: data.config['page_ranges'] != null ? `${data.config['page_ranges']}` : '', path: `${data.filename}`})
        })
    }

    execute_task(data){
        return new Promise(async (resolve,reject)=> {
            try{
                await this.cluster_instance.execute(data).then(data2 => {
                    resolve("success")
                }).catch(error => {
                    console.log(error)
                })
                
            } catch (error) {
                console.log(error)
                reject("failed")
            }
        })
    }

    config_size(config){
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
}

module.exports = puppet_cluster