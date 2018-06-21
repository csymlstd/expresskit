function Dependency() {
    this.dependencyMap = {}
    this.dependencyCache = {}
}

Dependency.prototype.register = function(name, constructor) {
    // if(typeof constructor !== 'function') throw new Error(name + ': Dependency constructor not a function')

    if(!name) throw new Error('Invalid dependency name')

    this.dependencyMap[name] = constructor

    return constructor
}

Dependency.prototype.get = function(name) {
    if(this.dependencyMap[name] === undefined) throw new Error(name + ': Unknown dependency')

    if(typeof this.dependencyMap[name] !== 'function') throw new Error(name + ': Dependency constructor not a function')

    // initialize dependency and cache if not cached
    if(this.dependencyCache[name] === undefined) {
        const dependencyConstructor = this.dependencyMap[name]
        const dependency = dependencyConstructor(this)
        if(dependency) {
            this.dependencyCache[name] = dependency
        }
    }

    return this.dependencyCache[name]
}

Dependency.prototype.clear = function() {
    this.dependencyCache = {}
    this.dependencyMap = {}
}

module.exports = new Dependency()