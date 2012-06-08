function Dashboard() {
    var SERIES_URL = "http://10.1.11.124:3000/metrics/";

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
        }
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

        console.log("!!!", chart);
        // TODO
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
    var views = [];
    if (chartType === "line") {
        // views.push({
        //     "name": "Total views",
        //     "data": seriesData.views
        // });
    }

    for (var i = 0; i < Math.min(5, seriesData.videos.length); i++) {
        views.push({
            "name": seriesData.videos[i].title.substr(0, 25),
            "data": seriesData.videos[i].views
        });
    }

    var chart = new Highcharts.Chart({
        chart: {
            renderTo: "chart",
            defaultSeriesType: chartType,
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
            // TODO
            //categories: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
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
                return "<b>"+ this.series.name +"</b><br/>"+ this.x +": "+ this.y;
            }
        },
        plotOptions: {
            area: {
                stacking: "normal"
            }
        },
        legend: {
            layout: "vertical",
            align: "right",
            verticalAlign: "top",
            x: -10,
            y: 100,
            borderWidth: 0
        },
        series: views
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
