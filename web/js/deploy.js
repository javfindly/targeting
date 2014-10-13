jQuery(document).ready(function($){

	var loadingDiv = $("<div class='loading'>&nbsp;</div>");
	var noResults = $("<li>No entities Ready to Deploy yet</li>");
    var deployEntityNewState = 'Ready to Test';
    var deployEntityOldState = 'Ready to Deploy';

    function debug(m){
        console.log(m)
    }

	function apiRequest ( uri, successCallback, errorCallback, options ) {
        var errorCallbackCalled = false;
        var defaultOptions = {
            url: uri,
            cache: false,
            async: true,
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
        var finalOptions = $.extend(true, defaultOptions, options);
        $.ajax( finalOptions );
    }
    
    function initBinders() {
        $("#deploy-all").click(function(e){
            e.preventDefault();
            var decision = window.confirm("This will move this Entities to 'Ready to Test' status. Are you sure?");
            if(decision == true) {
                updateState(function(status){
                    debug('Update State ' + status)
                    location.reload();
                });
            }
        }).dblclick(function(e){
            e.preventDefault();
        });
    }

    function bindIndividualDeploys() {
        $(".tpEntityRow .individual-approval").click(function(){
            $(this).unbind( "click" );
            var self = $(this);
            self.slideUp();
            showLoading(self.parent());
            var dataId = self.attr('data-id');
            var dataType = self.attr('data-type');
            debug('Send request for ' + dataId);
            deployEntity(dataId,dataType,function(){
                deployFeedbackPopUp(self,dataId,dataType);
            });
        }).dblclick(function(e){
            e.preventDefault();
        });
    }

    function deployFeedbackPopUp(self,dataId,dataType) {
        self.parent().find(".ticket-status").fadeOut();
        self.parent().children().slideUp();
        getTemplateAjax('templates/tp-entry-cancel.handlebars',function(template){
            var cancelDiv = template({
                dataId: dataId,
                newState: deployEntityNewState
            });
            var entityDiv = self.parent();
            setTimeout(function(){
                entityDiv.append(cancelDiv);
                entityDiv.find(".cancel-div").slideDown();
                bindCancelDeploy(entityDiv,dataId,dataType);
                bindDoneTask(entityDiv,dataId,dataType);
            },600);
        })
    }

    function bindCancelDeploy(entityDiv,dataId,dataType) {
        entityDiv.find('.cancel-task').click(function(){
            $(this).unbind( "click" );
            entityDiv.find('.cancel-task').slideUp();
            entityDiv.find('.done-task').slideUp();
            showLoading(entityDiv);
            var singleEntity = {
                id: dataId,
                type: dataType
            }
            updateState({
                update: [singleEntity],
                newState: deployEntityOldState
            },function(){
                cancelDeployMessage(dataId,entityDiv);
            });  
        });
    }

    function cancelDeployMessage(dataId,entityDiv) {
        debug('Operation cancelled for ' + dataId);
        entityDiv.children().slideUp();
        getTemplateAjax('templates/tp-entry-cancelled.handlebars',function(template){
            var cancelledDiv = template();
            setTimeout(function(){
                entityDiv.append(cancelledDiv);
                entityDiv.slideDown();
                bindDoneTask(entityDiv);
            },500);
        })
    }

    function showLoading(entity) {
        var loadingDivClone = loadingDiv.clone();
        loadingDivClone.hide();
        entity.find(".ticket-status").append(loadingDivClone);
        loadingDivClone.slideDown();
    }

    function bindDoneTask(entityDiv) {
        entityDiv.find('.done-task').click(function(){
            $(this).unbind( "click" );
            destroyEntity(entityDiv);
        });
    }

    function destroyEntity(entityDiv) {
        entityDiv.children().fadeOut();
        entityDiv.animate({width:'0px',heigth:'0px',opacity: 0},700);
        setTimeout( function() {
            entityDiv.remove();
            debug('removed');
        },800);
    }

    function deployEntity(id,type,done) {
        var singleEntity = {
            id: id,
            type: type
        }
        updateState({
            update: [singleEntity],
            newState: deployEntityNewState
        },done);
    }

    function getPromotionInfo() {
        $("#promotionInfo").append(loadingDiv);
        var uri = '/tp/last-promotion';
        apiRequest(uri, function(buildData){
            var promotion = buildData.promotion;
            var build = buildData.build;
            if(promotion.timestamp) {
                promotion.date = new Date(promotion.timestamp).toString();
            }
            if(build.timestamp) {
                build.date = new Date(build.timestamp).toString();
            }
            getTemplateAjax('templates/last-promotion-info.handlebars',function(template){
                var promotionInfo = template({
                    build: build,
                    promotion: promotion
                });
                $("#promotionInfo").html("");
                $("#promotionInfo").append(promotionInfo);
                getEntitiesReadyToDeploy(promotion);
            })
        }, function(error) {
            debug('Error: ' + error);
        },{
            method: 'GET'
        });

    }

    function getEntitiesReadyToDeploy(promotion) {
    	$("#tpEntities").html("");
    	$("#tpEntities").append(loadingDiv);
        var searchData = {
            promotion: promotion
        };
    	var uri = '/tp/search-deploy-ready';
		apiRequest(uri, function(resultList){
            $("#tpEntities").html("");
            if(resultList && resultList.length) {
                getTemplateAjax('templates/tp-entry-template.handlebars',function(template){
                    for(var i = 0; i < resultList.length;i++){
                    	var context = {entityFields:resultList[i]};
                    	var newItem = template(context);
                    	$("#tpEntities").append(newItem);
                    }
                    bindIndividualDeploys();
                    $("#tpEntities").fadeIn();
                    $("#deploy-all").fadeIn();
                })
            } else {
                $("#tpEntities").append(noResults);
            }
            updateTimes();
		}, function(error) {
			debug('Error: ' + error)
		},{
			method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(searchData)
		})
    }

    function updateState(entities,done) {
        var uri = '/tp/deploy-ready';
        apiRequest(uri, function(status){
            done(status);
        }, function(error) {
            debug('Error: ' + error)
        },{
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(entities)
        })
    }

    function updateTimes() {
        $(".moment-date").each(function(index,element){
            var humanTime = moment($(element).text()).fromNow();
            $(element).append("<strong>("+humanTime+")</strong>")
        });
    }
	
    initHandleBarsHelpers();
    initBinders();
	getPromotionInfo();
});