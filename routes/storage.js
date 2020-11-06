var storage = require('node-persist')

storage_instance = {
    async init(){
        console.log('Hall')
        await storage.init()
    },
    
    getStorage(){
        return storage
    }
    
}


module.exports = storage_instance