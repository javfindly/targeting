function getTemplateAjax(path, callback) {
	var source;
	var template;

	$.ajax({
	    url: path,
	        success: function(data) {
	            source    = data;
	            template  = Handlebars.compile(source);     
	            //execute the callback if passed
	            if (callback) callback(template);
	    }
	});
}

function initHandleBarsHelpers() {
    Handlebars.registerHelper('tpEntryTemplateRecursive', function(info) {
        var template = Handlebars.compile($('script#tp-entry-template').html());
        return template({
            entityFields:info,
            fromHelper: true
        });
    });

    Handlebars.registerHelper('ifEquals', function(v1, v2, options) {
        if(v1 === v2) {
            return options.fn(this);
        }
        return options.inverse(this);
    });

    Handlebars.registerHelper('isComplex', function(a,opts) {
        if(a instanceof Object) {
            return opts.fn(this);
        } else {
            return opts.inverse(this);      
        }
    });

    Handlebars.registerHelper("splitString", function(context, options){
        if(context && context.length){
            var ret = "";

            var tempArr = context.trim().split(options.hash["delimiter"]);

            for(var i=0; i < tempArr.length; i++) {
                ret = ret + options.fn(tempArr[i]);
            }
            return ret;
        }
    });

    Handlebars.registerHelper("tpDate", function(context, options){
        if(context && context.length){
            var dateString = context.substring("/Date(".length,context.indexOf('-'));
            var dateTimeStamp = parseInt(dateString);
            var time = new Date(dateTimeStamp);
            return time;
        }
    });         
}
