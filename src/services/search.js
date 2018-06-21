const config = require('../config')()
const Dependency = require('../config/dependencies')

if(config.search.url) {
    const es = Dependency.get('elasticsearch')
    const elastic = Dependency.register('elasticsearch-client', new es.Client({
        host: config.search.url
    }))
}

const defaults = { index: config.search.index, type: config.search.defaultType }

const Search = {
    status: async () => {
        return elastic.cat.indices({ v: true })
    },

    query: async (terms, types = [], size = config.search.limit) => {
        let query = {
            index: defaults.index,
            size,
            body: {
                query: {
                    bool: {
                        must: [
                            {
                                match: {
                                    name: {
                                        query: terms,
                                        fuzziness: 1
                                    }
                                }
                            }
                        ],
                        filter: []
                    }
                }
            }
        }

        // Filter by type field if available
        if(types.length > 0) {
            query.body.query.bool.filter.push({
                terms: {
                    type: types
                }
            })
        }

        return await elastic.search(query)
    },

    index: async (p = {}) => {
        let params = Object.assign({}, defaults, p)
        return elastic.index(params)
    },

    update: async (p = {}) => {
        let params = Object.assign({}, defaults, p)
        return elastic.update(params)
    },

    delete: async (p = {}) => {
        let params = Object.assign({}, defaults, p)
        return elastic.delete(params)
    },

    getActiveIndex: async () => {
        return elastic.indices.getAlias({
            name: config.search.index
        })
    },

    indexBulk: async (index, type, docs) => {
        let actions = []
        docs.forEach(doc => {
            actions.push({
                index: {
                    _index: index,
                    _type: config.search.defaultType,
                    _id: doc.id
                }
            })

            actions.push({
                type: doc.type,
                name: doc.name,
            })
        })

        return search.bulk({ body: actions })
    },

    indexSwitch: async (fresh, stale) => {
        let actions = []
        if(stale) actions.push({ remove_index: { index: stale }})
        actions.push({ add: { index: fresh, alias: config.search.index }})

        return elastic.indices.updateAliases({ body: { actions }})
    },

    indexExists: async (index) => {
        return elastic.indices.exists({ index })
    },

    indexDelete: async (index) => {
        return elastic.indices.delete({ index })
    },

    indexCreate: async (index) => {
        return elastic.indices.create({
            index,
            body: {
                'mappings': {
                    [config.search.defaultType]: {
                        'properties': config.search.defaultMapping
                    }
                }
            }
        })
    },
}

module.exports = Search