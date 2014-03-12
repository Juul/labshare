/*
  ToDo:

  * Allow absolute scopes like .foo.bar.baz
    this can be used to break out of sub-scopes
  * Template engine
  * Template fetching and pre-load
  * Link between template engine and doublebind
    So we can do e.g: <p class="nice-{{checked}}">
    or just <p>Hi my name is {{name}}</p>
    and have only the relevant parts auto-update.
  * Routing


    Notes on templating:

      1. Take the entire field that has a {{var}} in it.
         Dynamically create a function that will
         spit out the entire compiled field on demand.
         Bind a function so it will update the field by
         running the function every time var changes.
         
         UNSOLVED: How do we determine which vars
         are actually included in the {{exp}} expression?

         Perhaps there is a cheat:
           Run the expression once when compiling with
           watchers on all variables in scope.
           Hrm, no won't work since which are accessed
           can change based on logic.

         Maybe it is fine to have {{=var}} and {{exp}}
         and if you need something with an exp to
         update when a var changes, then you'll
         have to specify with my-trigger="var".
         If we do it this way, then the {{=var}} can be
         handled by doublebind and {{exp} by the 
         templating library.
         Check how angular does it.

         WAIT! Maybe we can just bind e.g. a div to 
         a var with my-bind, and then if there is any
         mention of {{something}} anywhere in the 
         outerHTML of the element, then instead of
         just replacing the innerHTML when the 
         var is changed, the entire outerHTML
         will be re-compiled from its template.
         We probably shouldn't even check for {{}}.
         Just recompile from template if there is a
         template handler registered.
         This can be optimized for arrays using
         my-bind-array, such that normal array
         operations like push, pop, shift, unshift, etc.
         will only cause affected elements to update.
         Can this maybe be autodetected by the fact
         that the variable being bound to is an array?
         
         To let the template expressions access vars
         using just varname instead of this.varname
         simply pass the scope object as arguments.

*/

function DoubleBind(opts, controllers) {
    // default opts
    this.opts = {
        topElement: null,
        attrPrefix: 'my-',
        debug: false,
        autoBind: [
            'input', 
            'textarea'
        ]
    };

    // override default opts
    for(var key in opts) {
        this.opts[key] = opts[key];
    }

    this._ = {};
    this.controllers = controllers;
    this.attrRegex = new RegExp('^'+this.opts.attrPrefix+'(.*)');

    // get the text of the opening tag for an element
    // e.g. "<body my-bind='foo'>" for document.body
    this.getOpenTag = function(el) {
        var attrs = [];
        if(el.id) {
            attrs.push({name:'id', value:el.id});
        }
        if(el.name) {
            attrs.push({name:'name', value:el.name});
        }
        return '<'+el.tagName.toLowerCase()+' '+attrs.concat([].slice.call(document.body.attributes)).map(function(attr) {if(attr && attr.value) return attr.name+'="'+attr.value+'"'}).join(' ')+'>';
    };

    this.debug = function(str) {
        if(!this.opts.debug) return;
        console.log('[DoubleBind] ' + str);
    };

    this.bindElement = function(el, scope, bindName, opts) {
        if(!bindName) return;
        scope.push(bindName);
        console.log("binding element: " +this.getOpenTag(el) + " to: " + scope.join('.'));

        var contScope = this.controllers.foo;
        var cont = this.controllers.foo.bar;
        var f;
        if(typeof(cont) == 'function') {
            f = cont;
        }
        if(opts.instant) {
            el.onkeyup = function(e) {

                f.bind(contScope)(el, el.value || el.innerHTML, e);
            };
        } else {
            el.onchange = function(e) {
                f.bind(contScope)(el, el.value || el.innerHTML, e);
            }
        }
    };

    this.objectifyAttributes = function(el) {
        var o = {
            attrs: {},
            myAttrs: {}
        };
        var m, i, attr, myAttrName;
        for(i=0; i < el.attributes.length; i++) {
            attr = el.attributes[i]
            m = attr.name.match(this.attrRegex);
            if(m && (m.length > 1)) {
                myAttrName = m[1];
                if(attr.value.length > 0) {
                    o.myAttrs[myAttrName] = attr.value;
                } else if(el.id) {
                    o.myAttrs[myAttrName] = el.id
                } else if(el.name) {
                    o.myAttrs[myAttrName] = el.name;
                }
            } else {
                o.attrs[attr.name] = attr.value;
            }
        }

        return o;
    };

    this.attachElement = function(el, scope) {
        var o = this.objectifyAttributes(el);
        scope = scope || [];

        if(o.myAttrs.scope) {
            scope.push(o.myAttrs.scope);
        }        
        if(scope.length <= 0) return scope;

        if(o.myAttrs.bind) {
            this.bindElement(el, scope, o.myAttrs.bind, o.myAttrs);
        } else if(this.opts.autoBind.indexOf(el.tagName.toLowerCase()) > -1) {
            this.bindElement(el, scope, el.id || el.name, o.myAttrs);
        }


        return scope;
    };

    this.attach = function(el, scope) {
        el = el || ((this.opts.topElement) ? document.getElementById(this.opts.topElement) : document.body);
        if(!el) return;
        scope = this.attachElement(el, scope);
        // recursively traverse elements
        // creating bindings as necessary
        var i;
        for(i=0; i < el.children.length; i++) {
            this.attach(el.children[i], scope);
        }
    };
    
    this.attach();
}


module.exports = function(opts, controllers) {
    return new DoubleBind(opts, controllers);
};