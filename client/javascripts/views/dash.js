function Dashboard() {
    var BASE_URL = "http://localhost:3000";
    var SERIES_URL = BASE_URL + "/metrics/";
    var SETTINGS_URL = BASE_URL + "/settings";

    var seriesData = null;
    var usageData = null;
    var editing = false;

    this.init = function () {
        initListeners();

        restoreState();

        loadSeriesData(getRange());
    };

    var initListeners = function () {
        $("#chart-opts li").on("tap", handleChartSelection);
        $("#range-opts li").on("tap", handleRangeSelection);
        $("#settings-button").on("tap", handleSettingsTap);
        $(".save-button").on("tap", handleSaveSettings);
    };

    var restoreState = function () {
        setOption("chart-opts", getChart());
        setOption("range-opts", getRange());
    };

    var loadSeriesData = function (range) {
        showLoadingMessage();

        var url = SERIES_URL + (range * 60);

        console.log("Loading: " + url);

        bc.device.fetchContentsOfURL(url, handleSeriesData, handleSeriesError);
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

    var handleSeriesError = function (error) {
        console.log(error);
    };

    var handleChartSelection = function (evt) {
        var chart = this.getAttribute("data-val");

        if (chart !== getChart()) {
            bc.core.cache("chart", chart);

            toggleOption($("#chart-opts li"), $(this));

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
        console.log("render chart");

        var chart = getChart();
        var range = getRange();

        new BrightcoveChart(seriesData, chart);
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
        return bc.core.cache("chart") || "line";
    };

    var getRange = function () {
        return bc.core.cache("range") || 24;
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

function BrightcoveChart(seriesData, chartType) {
    var interval = 3600000;
    var isWeekView = seriesData.views.length > 24;
    var series = [];

    if (chartType === "overall") {
        series.push({
            "name": "Total views",
            "data": seriesData.views,
            "pointStart": seriesData.start,
            "pointInterval": 60 * 60 * 1000
        });
    }

    else for (var i = 0; i < Math.min(5, seriesData.videos.length); i++) {
        series.push({
            "name": seriesData.videos[i].title,
            "data": seriesData.videos[i].views,
            "pointStart": seriesData.start,
            "pointInterval": interval
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
            type: "datetime"
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
                return "<b>"+ Mark.pipes.chop(this.series.name, 25) + "</b><br/>" + this.y + " views";
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
    return accounting.formatNumber(num);
};
