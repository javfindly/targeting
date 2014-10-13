var aggregators = {
	Sum: function(fieldName,resultList){
		var total = 0;
		for(var i = 0; i < resultList.length; i++){
			total+= resultList[i][fieldName];
		}
		return total;
	},
	Avg: function(fieldName,resultList){
		var total = 0;
		for(var i = 0; i < resultList.length; i++){
			total+= resultList[i][fieldName];
		}
		return total / resultList.length;
	},
	Count: function(fieldName,resultList){
		return resultList.length;
	},
	Max: function(fieldName,resultList){
		var maxValue = null;
		for(var i = 0; i < resultList.length; i++){
			if(maxValue === null) {
				maxValue = resultList[i][fieldName];
			} else {
				maxValue = Math.max(maxValue,resultList[i][fieldName]);
			}
		}
		return maxValue;
	},
	Min: function(fieldName,resultList){
		var minValue = null;
		for(var i = 0; i < resultList.length; i++){
			if(minValue === null) {
				minValue = resultList[i][fieldName];
			} else {
				minValue = Math.min(minValue,resultList[i][fieldName]);
			}
		}
		return minValue;
	},
	Concat: function(fieldName,resultList){
		var total = '';
		for(var i = 0; i < resultList.length; i++){
			total+=' '+resultList[i][fieldName];
		}
		return total.trim();
	},
}

jQuery(document).ready(function($){
	var loadingDiv = $("<div class='loading'>&nbsp;</div>");
	
	function executeQuery() {
		$(".results-container").text("");
		$(".results-container").append(loadingDiv);
		getSelectorValues('.query-filter input',getNameIfIsChecked,function(entities) {
			if(entities.length == 0) {
				debug('At least one entity is required')
			} else {
				getSelectorValues('.field-include input',getNameIfIsChecked,function(includes) {
					buildQuery(entities,includes);
				});
			}
		});
	}

	function getNameIfIsChecked(obj) {
		var isChecked = $(obj).prop('checked');
		if(isChecked){
			return $(obj).attr('name')
		} else {
			return null;
		}
	}

	function getSelectorValues(selector,getter,callback) {
		var filterSelector = $(selector);
		var count = filterSelector.length;
		if(count) {
			var entities = [];
			filterSelector.each(function(index,value){
				var entitieValue = getter(value);
				if (entitieValue) entities.push(entitieValue);
				if (!--count) callback(entities);
			})
		} else {
			callback([]);
		}
	}

	function callAggregators(itemCallback,done) {
		iterateSelector('#agreggator .aggregator',function(obj){
			var selectedAgg = $(obj).find('select').val();
			var operationField = $(obj).find('input').val();
			itemCallback(selectedAgg,operationField)
		},done)
		
	}	

	function applySummary(resultList,callback) {
		var summary = {
			TotalRecords: resultList.length
		};
		callAggregators(function(selectedAgg,fieldName){
			var aggregator = aggregators[selectedAgg];
			var result = aggregator(fieldName,resultList);
			summary[selectedAgg + '-' + fieldName] = result
		},function(){
			resultList.unshift(summary);
			callback(resultList);
		});
	}

	function createDownloadLink(obj) {
		var data = "text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(obj));
		$("#downloadJson").attr("href","data:" + data );
		$("#downloadJson").attr("download","data.json");
		$("#downloadJson").fadeIn();
	}

	function buildQuery(entities,includes) {
		var queryParams = '';
		queryParams = "conditions=" + $("#query-editor").val();
		for(var i = 0 ; i < entities.length ; i++) {
			queryParams+='&entities='+entities[i];
		}
		for(var i = 0 ; i < includes.length ; i++) {
			queryParams+='&includes='+includes[i];
		}
		var uri = '/tp/query?' + queryParams;
		apiRequest(uri, function(resultList){
			if(resultList && resultList.length){
				applySummary(resultList, function(resultList){
					$(".results-container").JSONView(resultList);
					createDownloadLink(resultList);
				});
			} else {
				$(".results-container").text("No results");
			}
		}, function(error) {
			debug('Error: ' + error)
		},{
			method: 'GET'
		})
	}

	function debug(t) {
		console.log(t)
	}

    function apiRequest ( uri, successCallback, errorCallback, options ) {
        var errorCallbackCalled = false;
        var defaultOptions = {
            url: uri,
            cache: false,
            async: true,
            crossDomain: true, 
            dataType: "json",
            success: function( response, textStatus, xOptions ) {
                var data = response;
                successCallback(data);
            },
            error: function( xOptions, textStatus ) {
                if( errorCallback && !errorCallbackCalled ) {
                    errorCallbackCalled = true;
                    errorCallback( textStatus, xOptions );
                } else {
                    debug('error ' + textStatus);
                }
            },
            failure: function( xOptions, textStatus ) {
                if( errorCallback && !errorCallbackCalled) {
                    errorCallbackCalled = true;
                    errorCallback( textStatus, xOptions );
                } else {
                    debug('error ' + textStatus);
                }
            },
            complete: function(xhr, data) {
                if(xhr.status >= 400) {
                    if( errorCallback && !errorCallbackCalled) {
                        errorCallbackCalled = true;
                        errorCallback( xhr.statusText + (xhr.responseText? (" " + xhr.responseText ):""));
                    }
                }
            }
        };
        $.ajax( $.extend(true, defaultOptions, options) );
    }

    function iterateSelector(selector,doSomething,done) {
		var filterSelector = $(selector);
		var count = filterSelector.length;
		if(count) {
			filterSelector.each(function(index,obj){
				doSomething(obj);
				if (!--count && done) done();
			})
		} else {
			done();
		}
	}

	function initBinders() {

		$("#query-execute").click(function(e){
			e.preventDefault();
			executeQuery();
		});

		$("#aggregator-add").click(function(e){
			e.preventDefault();
			var newAggregator = $("<div class='aggregator'>");
			var aggregatorSelect = $("<select>");
			for(var name in aggregators) {
				var agreggatorOption = $("<option value='"+name+"'>"+name+"</option>")
				aggregatorSelect.append(agreggatorOption);
			}
			var inputField = $("<input type='text'>");
			var removeMe = $("<div class='remove' onclick='javascript:removeMe(this)'>Remove</div>");
			newAggregator.append(aggregatorSelect);
			newAggregator.append(inputField);
			newAggregator.append(removeMe);
			$("#agreggator").append(newAggregator);
		})

		$("#query-include-all").click(function(e){
			e.preventDefault();
			iterateSelector('.field-include input',function(obj){
				$(obj).prop('checked',true);
			})
		});

		$("#query-include-none").click(function(e){
			e.preventDefault();
			iterateSelector('.field-include input',function(obj){
				$(obj).prop('checked',false);
			})
		});

		var keyCodesMap = {
			ctrlKey: 17,
			enterKey: 13
		}
		var keyMap = {};
		for(var keyName in keyCodesMap){
			keyMap[keyCodesMap[keyName]] = false;
		}

		$(".query-editor").keydown(function(e) {
			if (e.keyCode in keyMap) {
				keyMap[e.keyCode] = true;
				if (keyMap[keyCodesMap.ctrlKey] && keyMap[keyCodesMap.enterKey]) {
					executeQuery();
				}
			}
		}).keyup(function(e) {
		    if (e.keyCode in keyMap) {
		        keyMap[e.keyCode] = false;
		    }
		});
	}

	initBinders();
});