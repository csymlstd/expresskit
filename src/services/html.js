module.exports = {
    getTemplate: (template, vars, app) => new Promise((resolve, reject) => {
        app.render(template, vars, (err, html) => {
            if(err) return reject(err)
            return resolve(html)
        })
    })
}