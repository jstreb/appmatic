function Dashboard() {
    var BASE_URL = "http://furious-mountain-8079.herokuapp.com";
    var USAGE_URL = BASE_URL + "/usage/";
    var SERIES_URL = BASE_URL + "/metrics/";
    var SETTINGS_URL = BASE_URL + "/settings";

    var seriesData = null;
    var usageData = null;
    var editing = false;

    this.init = function () {
        initListeners();

        restoreState();

        loadUsageData();
    };

    var initListeners = function () {
        $("#chart-opts li").on("tap", handleChartSelection);
        $("#range-opts li").on("tap", handleRangeSelection);
        $("#settings-button").on("tap", handleSettingsTap);
        $(".save-button").on("tap", handleSaveSettings);
        $("body").on("tap", ".results li", handleVideoTap);
    };

    var restoreState = function () {
        var chart = getChart();
        var range = getRange();

        setOption("chart-opts", chart);
        setOption("range-opts", range);

        $("#range-opts").toggle(chart !== "io");
    };

    var loadUsageData = function () {
        console.log("Loading " + USAGE_URL);

        bc.device.fetchContentsOfURL(USAGE_URL, handleUsageData, handleError);
    };

    var loadSeriesData = function (range) {
        showLoadingMessage();

        var url = SERIES_URL + (range * 60);

        console.log("Loading: " + url);

        bc.device.fetchContentsOfURL(url, handleSeriesData, handleError);
    };

    var handleSeriesData = function (data) {
        hideLoadingMessage();

        try {
            seriesData = JSON.parse(data);
        }
        catch (e) {
            seriesData = data;
        }

        renderChart();
        renderList();
    };

    var handleUsageData = function (data) {
        usageData = data;

        loadSeriesData(getRange());
    };

    var handleError = function (error) {
        console.log(error);
    };

    var handleChartSelection = function (evt) {
        var chart = this.getAttribute("data-val");

        if (chart !== getChart()) {
            bc.core.cache("chart", chart);

            toggleOption($("#chart-opts li"), $(this));

            $("#range-opts").toggle(chart !== "io");

            renderChart();
        }
    };

    var handleRangeSelection = function (evt) {
        var range = this.getAttribute("data-val");

        if (range !== getRange()) {
            bc.core.cache("range", range);

            toggleOption($("#range-opts li"), $(this));

            loadSeriesData(range);
        }
    };

    var handleSettingsTap = function () {
        editing = !editing;

        if (editing) {
            $("#settings").show();
        }
        else {
            $("#settings").hide();
            $( ".save-button" ).html( "Save" );
        }
    };
    
    var handleSaveSettings = function () {
        function success(data) {
            $( ".save-button" ).html( "Saved" );
            setTimeout( handleSettingsTap, 500 );
        }
        
        function error( data ) {
          console.log( "Something went wrong." + data );
        }
        var data = {
            limitThreshold: $( "#limitThreshold" ).val(),
            viralThreshold: $( "#viralThreshold" ).val()
        }
        bc.device.postDataToURL( SETTINGS_URL, success, error, { data: data } );
        $( ".save-button" ).html( "Saving..." );
    }

    var handleVideoTap = function (evt) {
        var url = this.getAttribute("data-video-url");
        bc.device.openURI(url, function(){}, function(){}, { modalWebBrowser: true });
    };

    var toggleOption = function($list, $listItem) {
        $list.removeClass("current");
        $listItem.addClass("current");
    };

    var setOption = function (listId, listVal) {
        $("#" + listId + " li[data-val='" + listVal + "']").addClass("current");
    };

    var renderChart = function () {
        var chartType = getChart();
        var chartData = chartType === "io" ? usageData : seriesData;

        new BrightcoveChart(chartData, chartType);
    };

    var renderList = function () {
        console.log("render list");

        var template = bc.templates["top-ten"];
        var context = seriesData;
        var markup = Mark.up(template, context);

        $("#results").html(markup);

        renderSparks();
        renderBars();

        Scrollbox.get("results-scroll").top();
    };

    var renderSparks = function () {
        var elems = $(".video-spark");
        var videos = seriesData.videos;

        for (var i = 0; i < videos.length; i++) {
            Spark(elems[i], videos[i].views);
        }
    };

    var renderBars = function () {
        var elems = $(".video-bar");
        var total = Mark.pipes.total(seriesData.views);
        var videos = seriesData.videos;

        for (var i = 0; i < videos.length; i++) {
            Bar(elems[i], Mark.pipes.total(videos[i].views) / total);
        }
    };

    var getChart = function () {
        return bc.core.cache("chart") || "overall";
    };

    var getRange = function () {
        return bc.core.cache("range") || 12;
    };

    var showLoadingMessage = function () {
        $("#loading").css("opacity", 1);
    };

    var hideLoadingMessage = function () {
        setTimeout(function () {
            $("#loading").css("opacity", 0);
        }, 500);
    };
}

function BrightcoveChart(chartData, chartType) {
    var interval = 3600000;
    var isWeekView = chartType !== "io" && chartData.views.length > 24;
    var series = [];

    if (chartType === "overall") {
        series.push({
            "name": "Total views",
            "data": chartData.views,
            "pointStart": chartData.start,
            "pointInterval": interval
        });
    }
    else if (chartType === "top") {
        for (var i = 0; i < Math.min(5, chartData.videos.length); i++) {
            series.push({
                "name": chartData.videos[i].title,
                "data": chartData.videos[i].views,
                "pointStart": chartData.start,
                "pointInterval": interval
            });
        }
    }
    else if (chartType === "io") {
        var bytesIn = [];
        var bytesOut = [];
        var bytesOverhead = [];
        var points;

        points = chartData.data.bytes_in;
        for (var i in points) {
            bytesIn.push([parseInt(i), points[i]]);
        }
        series.push({
            "name": "Bytes In",
            "data": bytesIn
        });

        points = chartData.data.bytes_out;
        for (var i in points) {
            bytesOut.push([parseInt(i), points[i]]);
        }
        series.push({
            "name": "Bytes Out",
            "data": bytesOut
        });

        points = chartData.data.bytes_overhead;
        for (var i in points) {
            bytesOverhead.push([parseInt(i), points[i]]);
        }
        series.push({
            "name": "Bytes Overhead",
            "data": bytesOverhead
        });
    }

    var chart = new Highcharts.Chart({
        chart: {
            renderTo: "chart",
            defaultSeriesType: "line",
            marginRight: 130,
            marginBottom: 25
        },
        title: {
            text: null
        },
        subtitle: {
            text: null
        },
        xAxis: {
            type: "datetime",
            dateTimeLabelFormats: {
                second: '%H:%M:%S',
                minute: '%H:%M',
                hour: '%I:%M%P',
                day: '%b %e',
                week: '%b %e',
                month: '%b \'%y',
                year: '%Y'
            }
        },
        yAxis: {
            title: {
                text: "Video Views"
            },
            plotLines: [{
                value: 0,
                width: 1,
                color: "#808080"
            }]
        },
        tooltip: {
            formatter: function() {
                var name = Mark.pipes.chop(this.series.name, 25);
                var label = chartType === "io" ? "bytes" : "views";
                var value = Highcharts.numberFormat(this.y, 0);
                return "<b>" + name + "</b><br/>" + value + " " + label;
            }
        },
        plotOptions: {
            area: {
                stacking: "normal"
            },
            line: {
                animation: !isWeekView,
                marker: {
                    enabled: !isWeekView
                }
            }
        },
        legend: {
            layout: "vertical",
            align: "right",
            verticalAlign: "top",
            x: -10,
            y: 100,
            borderWidth: 0,
            labelFormatter: function() {
                return Mark.pipes.chop(this.name, 20);
            }
        },
        series: series
    });
}

Mark.pipes.total = function (array) {
    var n = 0;

    for (var i = 0; i < array.length; i++) {
        n += array[i] || 0;
    }

    return n;
};

Mark.pipes.accounting = function (num) {
    return Highcharts.numberFormat(num, 0);
};

function Pushnotification() {
    $( bc ).bind( "pushnotification", handlePushNotification );
    
    function handlePushNotification( data ) {
       var meta = data.params;
       
       if( meta && meta.type === "quota" ) {
        bc.device.openURI( "http://i.imgur.com/6v4gQ.gif" );
         return;
       }
       
       if( meta && meta.type === "viral" ) {
         bc.device.openURI( "http://i.imgur.com/kodRQ.gif" );
         return;
       }
    }
}
