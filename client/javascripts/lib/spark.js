function Spark(canvas, data) {
    var maxVal = function (array) {
        return Math.max.apply(null, array);
    };

    var minVal = function (array) {
        return Math.min.apply(null, array);
    };

    var min = minVal(data);
    var max = maxVal(data);
    var range = max - min;

    var getX = function (idx) {
        return idx * (canvas.width / (data.length - 1));
    };

    var getY = function (val) {
        var h = canvas.height - 4;
        return h - ((h - 2) * ((val - min) / range));
    };

    var ctx = canvas.getContext("2d");
    ctx.strokeStyle = "#FFCC00";
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    ctx.moveTo(0, getY(data[0]));

    for (var i = 1; i < data.length; i++) {
        ctx.lineTo(getX(i), getY(data[i]));
    }

    ctx.stroke();
}

function Bar(canvas, percent) {
    var x = Math.max(5, Math.ceil(percent * canvas.width));
    var ctx = canvas.getContext("2d");

    // ctx.fillStyle = "#00FF00";
    // ctx.beginPath();
    // ctx.moveTo(0, 0);
    // ctx.lineTo(x, 0);
    // ctx.lineTo(x, canvas.height);
    // ctx.lineTo(0, canvas.height);
    // ctx.fill();

    var grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, "#00FF00");
    grad.addColorStop(1, "#003300");

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, x, canvas.height);
}
