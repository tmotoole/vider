/**
 * Created by sunny on 2/18/16.
 */
define(["jquery", "d3", "d3-tip", "colorbrewer", "filterData","global"],
    function ($, d3, d3tip, colorbrewer, filterData,global) {

        var localFormName;
        var localVarName;
        var fieldLabel;
        var stratData;
        var sel;
        var max =  Number.MIN_VALUE;
        var FILTER ={
            HOVER: 0,
            CLICK: 1,
            SELECTION: 2,
            DEFAULT: 3,
            UNCLICK: 4,
            UNHOVER: 5,
            NONE:6,
            CTRLCLICK:7
        }

        var transDuration = 1000;

        //call the numerical histogram handler

        this.lastKeyPressed = -1;

        // https://github.com/wbkd/d3-extended
        d3.selection.prototype.moveToFront = function() {
            return this.each(function(){
                this.parentNode.appendChild(this);
            });
        };

        /**
         *
         */
        var init = function () {

            //strat
            var self = this;
            var textWidth = 140;
            var margin = {top: 40, right: 20, bottom: 60, left: 40},
                width = 750 - margin.left - margin.right,
                height = 25 * Object.keys(stratData[0].original).length + margin.top + margin.bottom;
            var flag = false;

            var drag= d3.behavior.drag()
                .origin(function(d) {
                    return d;
                })
                //.on("dragstart", dragstarted)
                //.on("drag", dragged)
                //.on("dragend", dragended);

            function dragstarted(d) {
                d3.event.sourceEvent.stopPropagation();
                d3.select(this).classed("dragging", true);
                flag = true;
            }

            function dragged(d) {
                var eventY = d3.event.y;
                d3.select(this).moveToFront();
                d3.select(this)
                    .attr("y", d.y = eventY)
                    .attr("transform", function (d) {
                        //var yScale = d3.select(this.parentNode).datum().yScale;
                        d.y = eventY;
                        if(d.y < 0){
                            d.y = 0;
                        }
                        else if(d.y > max){
                            d.y = max;
                        }

                        return "translate(" + 0 + "," + d.y  + ")";
                    });

                d3.select(this.parentNode)
                    .selectAll(".barGroup")
                    .each(function(d){
                        if(d.y - 12 < eventY && eventY < d.y){
                            d3.select(this)
                                .select(".overlay-horizontal-nominal-bar")
                                .style("fill","red");
                        }
                        else{
                            d3.select(this)
                                .select(".overlay-horizontal-nominal-bar")
                                .style("fill","#3366cc");
                        }
                    })
            }

            function dragended(d) {
                d3.select(this).classed("dragging", false);
                var newY = d.y;
                var mergeFrom = d;

                d3.select(this.parentNode)
                    .selectAll(".barGroup")
                    .each(function(d){

                        if(d.y - 12 < newY && newY < d.y && flag){

                            var mergeTo = d;
                            var form = mergeFrom.form;
                            var variable = mergeFrom.variable;
                            var topData = $.extend(true,{},require("stateCtrl").top()); // get the copy of the data
                            var data = topData.mainPanel.data[form].fields[variable].data;
                            var obj = topData.mainPanel.data[form].fields[variable].obj;
                            var new_categories = "";

                            var categories = obj.select_choices_or_calculations.split("|");
                            categories.forEach(function (cat) {
                                var pair = cat.split(",");
                                var key = pair[0].trim();
                                var value = pair[1].trim();


                                if(key != mergeTo.key && key != mergeFrom.key){
                                    new_categories += key +", "+value +' | ';
                                }
                            });

                            //join both the keys to the new key
                            new_categories += mergeFrom.key
                                + ", "
                                + String(mergeFrom.value)
                                + " / "
                                + String(mergeTo.value);
                            obj.select_choices_or_calculations = new_categories;


                            //this will merge all the data values
                            for(var i = 0 ; i < data.length; i++){
                                if(data[i] == mergeTo.key){
                                    data[i] = mergeFrom.key;
                                }
                            }

                            //add the top data on the queue
                            require("stateCtrl").add(topData);

                            flag = false;
                            //this will refresh the view with the new state
                            require("view").updateNewState(require("stateCtrl").top());
                        }
                    });
            }

            ////////////////////////////////////////////////////////////////////////////////////////////////
            //Tips
            ////////////////////////////////////////////////////////////////////////////////////////////////
            var colorByTip = global.tips.colorByTip;
            var tip = global.tips.tip1;
            var queryTip = global.tips.queryTip;
            var textTip = global.tips.numTextTip;

            /*var circleTip = d3tip()
             .attr('class', 'd3-tip')
             .offset([-12, 0])
             .html(function(d) {
             return "<strong>"
             + d.label
             + ":</strong> <span style='color:red'>"
             + d.count; });*/


            ////////////////////////////////////////////////////////////////////////////////////////////////
            //Create Container
            ////////////////////////////////////////////////////////////////////////////////////////////////
            sel.select("h5").text(fieldLabel);

            var maxOrgCount = d3.max(stratData,function(obj){
                return d3.max(d3.values(obj.original), function (d) {
                    return d.originalCount;
                });
            });

            stratData.map(function(d){
                d.maxOrgCount = maxOrgCount;
            });



            var svg = sel.selectAll("svg").data(stratData);
            var svgElements = svg.enter().append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height)
                .classed("graph-inner",true);;
            svg.exit().remove();

            svgElements.append("rect")
                .style("class", "graph-label-box")
                .attr("x", 0)
                .attr("y", 0)
                .attr("width", width + margin.left + margin.right - 7)
                .attr("height", height)
                .attr("fill", "#f9f9f9")
                .on("click",function(d){

                    // add the filter in the filter data
                    filterData.add(d.form, d.variable, d.key, FILTER.UNCLICK);
                    // add filter data int this data so that
                    require("view").updateNewState(require("stateCtrl").top());
                });

            svgElements.append("text")
                .attr("class", "graph-label")
                .attr("x", 5)
                .attr("y", 20)
                .attr("width", width + margin.left + margin.right - 7)
                .text(function (d) {
                    var label = d.label.length > 40 ?  d.label.substr(0,40) + "..." : d.label;
                    return label;
                })

            svg.select("text")
                .attr("class", "graph-label")
                .attr("x", 5)
                .attr("y", 20)
                .attr("width", width + margin.left + margin.right - 7)
                .on("mouseover",function(d){
                    global.tips.numTextTip.show(d.label);
                })
                .on("mouseout",global.tips.numTextTip.hide)
                .text(function (d) {
                    var label = d.label.length > 40 ?  d.label.substr(0,40) + "..." : d.label;
                    return label;
                })

            svgElements.append("g")
                .classed("main",true)
                .attr("transform", "translate(" + 0 + "," + margin.top  + ")");

            svg.call(tip);
            svg.call(queryTip);
            svg.call(textTip);
            svg.call(colorByTip);

            ////////////////////////////////////////////////////////////////////////////////////////////////
            //Set the Scales
            ////////////////////////////////////////////////////////////////////////////////////////////////
            svg.each(function(d) {

                var original = d3.values(d.original);
                var localHeight = 25 * Object.keys(original).length;
                var xScale = d3.scale.linear()
                    .domain([0, d.maxOrgCount])
                    .range([textWidth, width])
                    .nice();

                var yScale = d3.scale.ordinal()
                    .rangeRoundBands([0, localHeight], .1);

                yScale.domain(original.map(function (d) {
                    return d.value;
                }))

                var xAxis = d3.svg.axis();
                xAxis.scale(xScale);
                xAxis.orient("bottom");
                xAxis.ticks(5);

                var axis = d3.select(this) //this will select current svg
                    .select("g")
                    .selectAll(".axis")
                    .data([1]);

                axis.enter().append("g");

                axis.classed("axis", true)
                    .attr("transform", "translate("
                        + 0 + "," + localHeight + ")")
                    .call(xAxis)
                    .selectAll("text")
                    .style("text-anchor", "end")
                    .attr("dx", "-.8em")
                    .attr("dy", ".15em")
                    .attr("transform", function(d) {
                        return "rotate(-90)"
                    })
                    .transition().duration(transDuration)
                    .attr("opacity", 1);

                //set the original again
                //d.original = original;

                //this will attach scales to the data
                d3.select(this).data([{
                    "xScale": xScale,
                    "yScale": yScale,
                    "data":d
                }]);
            });

            ////////////////////////////////////////////////////////////////////////////////////////////////
            //Bar group
            ////////////////////////////////////////////////////////////////////////////////////////////////
            var group = svg.select(".main").selectAll(".barGroup")
                .data(function(d){
                    return d3.values(d.data.original);
                });

            group.enter().append("g")

            var groupEnter = group.classed("barGroup", true)
                .classed("barGroup", true)
                .attr("transform", function (d) {
                    var yScale = d3.select(this.parentNode).datum().yScale;
                    d.y = yScale(d.value);
                    if(max < d.y){
                        max = d.y;
                    }
                    return "translate(" + 0 + "," + d.y  + ")";
                })
                .on("click",function(d){


                    var filterClicked = FILTER.CLICK;
                    if(event.ctrlKey || event.metaKey){
                        filterClicked = FILTER.CTRLCLICK;
                    };

                    //remove all the foreign object
                    d3.selectAll("foreignObject").remove();

                    //add new foreign object
                    var fo = d3.select(this).append("foreignObject");
                    fo.attr("x", function(d){
                            var xScale = d3.select(this.parentNode.parentNode)
                                .datum().xScale;
                            return textWidth + Math.abs(xScale(d.queryCount) - xScale(0)) + 15;
                        })
                        .attr("y", 3)
                        .attr("width", 10)
                        .attr("height", 10)
                        .style("float","left")
                        .append("xhtml:a")
                        .attr("data-toggle","tooltip")
                        .attr("title",function(d){
                            return "Filter by " + d.value;
                        })
                        .append("xhtml:i")
                        .attr("class",'fa fa-filter')
                        .style("font-size","12")
                        .attr("aria-hidden",'true')
                        .on("click", function (d) {
                            // add the filter in the filter data
                            filterData.add(d.form, d.variable, d.obj, FILTER.SELECTION);
                            // add filter data int this data so that
                            require("view").updateNewState(require("stateCtrl").top());
                            //if clicked then remove all the foreign object
                            d3.selectAll("foreignObject").remove();
                        })

                        if(event.shiftKey && self.lastKeyPressed != -1) {

                            var from = 0, to = 0;
                            if(self.lastKeyPressed < parseInt(d.index)){
                                from = self.lastKeyPressed;
                                to = parseInt(d.index);
                            }
                            else{
                                from = parseInt(d.index);
                                to = self.lastKeyPressed;
                            }
                            for ( var index = from ; index <= to ; index++){
                                group.each(function(d){
                                    if(parseInt(d.index) == index){
                                        filterData.add(d.form, d.variable, d.obj, FILTER.CTRLCLICK);
                                    }
                                })
                            }
                        }
                        else{
                            // add the filter in the filter data
                            filterData.add(d.form, d.variable, d.obj, filterClicked);
                        }

                    //track the last key pressed
                    self.lastKeyPressed = parseInt(d.index);

                    // add filter data int this data so that
                    require("view").updateNewState(require("stateCtrl").top());


                })
                .on("mouseenter",function(d){
                    // add the filter in the filter data
                    filterData.add(d.form, d.variable, d.obj, FILTER.HOVER);
                    // add filter data int this data so that
                    require("view").updateNewState(require("stateCtrl").top());
                })
                .on("mouseleave",function(d){
                    // add the filter in the filter data
                    filterData.remove(d.form, d.variable, d.obj.x, FILTER.UNHOVER);
                    // add filter data int this data so that
                    require("view").updateNewState(require("stateCtrl").top());
                });


            group.call(drag);

            group.exit().remove();


            var textEnter = groupEnter.selectAll("text")
                .data(function(d){
                    return [d.value];
                });
            textEnter.enter().append("text")
                .on("mouseover",textTip.show)
                .on("mouseout",textTip.hide)
                .attr("opacity", 0)
                .transition().duration(transDuration)
                .attr("opacity", 1);

            textEnter.text(function (d) {
                if(d.length <= 20 ) {
                    return d;
                }
                else{
                    return d.substring(0,17) + "...";
                }
            }).attr("x", textWidth - 10)
                // dy is a shift along the y axis
                .attr("dy", function(d){
                    return d3.select(this.parentNode.parentNode).datum().yScale.rangeBand() / 2;
                })
                // align it to the right
                .attr("text-anchor", "end")
                // center it
                .attr("alignment-baseline", "middle")
                .attr("data-toggle","modal")
                .attr("data-target","#code");

            var backBarEnter = groupEnter.selectAll(".horizontal-nominal-bar")
                .data(function(d){
                    return [d];
                });

            backBarEnter.enter().append("rect")
                .attr("class","horizontal-nominal-bar")
                .attr("width", "0")
                .on("mouseover",tip.show)
                .on("mouseout",tip.hide)
                .call(drag);

            backBarEnter.attr("x", textWidth)
                .attr("height", function(){
                    return d3.select(this.parentNode.parentNode).datum().yScale.rangeBand();
                })
                .transition().duration(transDuration)
                .attr("width", function (d) {
                    // here we call the scale function.
                    var xScale = d3.select(this.parentNode.parentNode).datum().xScale;
                    return Math.abs(xScale(d.originalCount) - xScale(0));
                });

            //backBarEnter.exit().remove();


            var overlayBarEnter = groupEnter.selectAll(".overlay-horizontal-nominal-bar")
                .data(function(d){
                    return [d];
                });

            overlayBarEnter.enter().append("rect")
                .attr("class","overlay-horizontal-nominal-bar")
                .attr("width", "0")
                .on("mouseover",queryTip.show)
                .on("mouseout",queryTip.hide);

            overlayBarEnter
                .attr("x", textWidth)
                .attr("height", function(){
                    return d3.select(this.parentNode.parentNode).datum().yScale.rangeBand();
                })
                .transition().duration(transDuration)
                .attr("width", function (d) {
                    // here we call the scale function.
                    var xScale = d3.select(this.parentNode.parentNode).datum().xScale;
                    return Math.abs(xScale(d.queryCount) - xScale(0));
                });

            var hoverBarEnter = groupEnter.selectAll(".hover-nominal-bar")
                .data(function(d){
                    return [d];
                });

            hoverBarEnter.enter().append("rect")
                .attr("class","hover-nominal-bar")
                .attr("width", "0")
                .on("mouseover",queryTip.show)
                .on("mouseout",queryTip.hide);

            hoverBarEnter.attr("x", textWidth)
                .attr("height", function(){
                    return d3.select(this.parentNode.parentNode).datum().yScale.rangeBand();
                })
                .attr("width", function (d) {
                    // here we call the scale function.
                    var xScale = d3.select(this.parentNode.parentNode).datum().xScale;
                    return Math.abs(xScale(d.hoverCount) - xScale(0));
                });



           var colorGroup = groupEnter.selectAll(".color-grp")
                .data(function(d){

                    var xScale = d3.select(this.parentNode.parentNode).datum().xScale;
                    var range = Math.abs(xScale(d.originalCount) - xScale(0));
                    var scale = d3.scale.linear().domain([0, d.colorTotal]).range([0,range]);
                    var colorKeys = d3.keys(d.colorByObj);
                    var color = d3.scale.ordinal().domain(colorKeys).range(colorbrewer.Set1[colorKeys.length % 11]);


                    var colorByMap = {};
                    var indexCounter = textWidth ;
                    for(var key in d.colorByObj){
                        d.colorByObj[key].color  = color(key);
                        d.colorByObj[key].xIndex = indexCounter;
                        d.colorByObj[key].width  = scale(d.colorByObj[key].count);
                        indexCounter += scale(d.colorByObj[key].count);


                        //todo: this is the work around solution to get the colors
                        //todo: on the view filter panel
                        if (d.colorByObj[key].obj != null) { // this is number
                            colorByMap[d.colorByObj[key].obj.x + " - "
                            + (d.colorByObj[key].obj.x + d.colorByObj[key].obj.dx)]
                                = color(key);
                        }
                        else{
                            colorByMap[d.colorByObj[key].value] = color(key)
                        }
                    }

                    filterData.setColorByScale(colorByMap);

                    return [d.colorByObj];
                });

            colorGroup.enter().append("g")
                .attr("x", textWidth)
                .attr("class","color-grp")
                .attr("height", function(d){
                    d.yScale = d3.select(this.parentNode.parentNode).datum().yScale.rangeBand();
                    return d.yScale;
                });

            colorGroup.exit().remove();



            var colorRectEnter = colorGroup.selectAll(".color-rect")
                .data(function(d){
                    return d3.values(d);
                });

            colorRectEnter.enter().append("rect");

            colorRectEnter.attr("class","color-rect")
                .style("fill",function(d){
                    return d.color;
                })
                .attr("x", function(d){
                    return d.xIndex;
                })
                .attr("height", function(){
                    return d3.select(this.parentNode.parentNode.parentNode).datum().yScale.rangeBand();
                })
                .attr("width", function (d) {
                    return d.width;
                })
                .on("mouseover",colorByTip.show)
                .on("mouseout",colorByTip.hide);

            colorRectEnter.exit().remove();
        }

        var _create = function (_container, _localFormName, _localVarName, _fieldLabel, _stratData) {

            sel = _container;
            localFormName = _localFormName;
            localVarName = _localVarName;
            fieldLabel = _fieldLabel;
            stratData = _stratData;

            init();
        }
        return {
            create: _create
        }
    })
