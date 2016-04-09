/* async load function */
function async(u, c) {
    var d = document, t = "script",
        o = d.createElement(t),
        s = d.getElementsByTagName(t)[0];
    o.src = u;
    if (c) {
        o.addEventListener("load", function (e) {
            c(null, e);
        }, false);
    }
    s.parentNode.insertBefore(o, s);
}

/* Highlight.js */
async("//cdn.bootcss.com/highlight.js/9.2.0/highlight.min.js", function () {
    hljs.initHighlightingOnLoad();
});

/* fastclick */
async("//cdn.bootcss.com/fastclick/1.0.6/fastclick.min.js", function () {
    // global FastClick!!
    FastClick.attach(document.body);
});

$(function () {
    var $toggle = document.querySelector(".navbar-toggle");
    var $navbar = document.querySelector('#blog_navbar');
    var $collapse = document.querySelector(".navbar-collapse");
    var blogNav = {
        close: function () {
            $navbar.className = " ";
            // wait until animation end.
            setTimeout(function () {
                // prevent frequently toggle
                if ($navbar.className.indexOf('in') < 0) {
                    $collapse.style.height = "0px"
                }
            }, 400)
        },
        open: function () {
            $collapse.style.height = "auto";
            $navbar.className += " in";
        }
    };
    // Bind Event
    $toggle.addEventListener('click', function (e) {
        if ($navbar.className.indexOf('in') > 0) {
            blogNav.close()
        } else {
            blogNav.open()
        }
    });
    /**
     * Since Fastclick is used to delegate 'touchstart' globally
     * to hack 300ms delay in iOS by performing a fake 'click',
     * Using 'e.stopPropagation' to stop 'touchstart' event from
     * $toggle/$collapse will break global delegation.
     *
     * Instead, we use a 'e.target' filter to prevent handler
     * added to document close HuxNav.
     *
     * Also, we use 'click' instead of 'touchstart' as compromise
     */
    document.addEventListener('click', function(e){
        if(e.target == $toggle) return;
        if(e.target.className == 'icon-bar') return;
        blogNav.close();
    })
});

$(function () {
    var edit = $("#edit-in-github");
    if(edit.length > 0) {
        edit.attr("href", pagePath);
    }
});

/* only load tagcloud.js in tag.html */
if ($("#tag_cloud").length > 0) {

    (function($) {

        $.fn.tagcloud = function(options) {
            var opts = $.extend({}, $.fn.tagcloud.defaults, options);
            tagWeights = this.map(function(){
                return $(this).attr("rel");
            });
            tagWeights = jQuery.makeArray(tagWeights).sort(compareWeights);
            lowest = tagWeights[0];
            highest = tagWeights.pop();
            range = highest - lowest;
            if(range === 0) {range = 1;}
            // Sizes
            if (opts.size) {
                fontIncr = (opts.size.end - opts.size.start)/range;
            }
            // Colors
            if (opts.color) {
                colorIncr = colorIncrement (opts.color, range);
            }
            return this.each(function() {
                weighting = $(this).attr("rel") - lowest;
                if (opts.size) {
                    $(this).css({"font-size": opts.size.start + (weighting * fontIncr) + opts.size.unit});
                }
                if (opts.color) {
                    // change color to background-color
                    $(this).css({"backgroundColor": tagColor(opts.color, colorIncr, weighting)});
                }
            });
        };


        // Converts hex to an RGB array
        function toRGB (code) {
            if (code.length == 4) {
                code = jQuery.map(/\w+/.exec(code), function(el) {return el + el; }).join("");
            }
            hex = /(\w{2})(\w{2})(\w{2})/.exec(code);
            return [parseInt(hex[1], 16), parseInt(hex[2], 16), parseInt(hex[3], 16)];
        }

        // Converts an RGB array to hex
        function toHex (ary) {
            return "#" + jQuery.map(ary, function(i) {
                    hex =  i.toString(16);
                    hex = (hex.length == 1) ? "0" + hex : hex;
                    return hex;
                }).join("");
        }

        function colorIncrement (color, range) {
            return jQuery.map(toRGB(color.end), function(n, i) {
                return (n - toRGB(color.start)[i])/range;
            });
        }

        function tagColor (color, increment, weighting) {
            rgb = jQuery.map(toRGB(color.start), function(n, i) {
                ref = Math.round(n + (increment[i] * weighting));
                if (ref > 255) {
                    ref = 255;
                } else {
                    if (ref < 0) {
                        ref = 0;
                    }
                }
                return ref;
            });
            return toHex(rgb);
        }

        function compareWeights(a, b)
        {
            return a - b;
        }

    })(jQuery);


    $(function () {
        $.fn.tagcloud.defaults = {
            size: {start: 1, end: 1, unit: "em"},
            color: {start: "#bbbbee", end: "#0085a1"},
        };
        $("#tag_cloud a").tagcloud();
    })
}


/* jquery.scrollUp */
$(function () {
    $.scrollUp({
        scrollName: "scrollUp",// 元素ID
        animation: "slide",// 动画类型Fade, slide, none
        scrollText: "",// 元素文本
        activeOverlay: false// 显示scrollUp的基准线，false为不显示, e.g "#00FFFF"
    });
    var scrollUp = $("#scrollUp");
    scrollUp.addClass("fa fa-chevron-circle-up fa-3x");
});

/* make all images responsive */
$(function () {
    $("img").addClass("img-responsive");
});

/* Scroll News */
$(function () {
    $(function () {
        var news = $("#news");
        if(news.length > 0) {
            news.vTicker({
                speed: 1000,
                pause: 3000,
                showItems: 1
            });
        }
    });
});

/* responsive tables */
$(function () {
    var table = $("table");
    table.wrap("<div class='table-responsive'></div>");
    table.addClass("table");
});

/* responsive embed videos */
$(function () {
    var y = $("iframe[src*='youtube.com']");
    var v = $("iframe[src*='vimeo.com']");
    y.wrap("<div class='embed-responsive embed-responsive-16by9'></div>");
    y.addClass("embed-responsive-item");
    v.wrap("<div class='embed-responsive embed-responsive-16by9'></div>");
    v.addClass("embed-responsive-item");
});

/* Navigation Scripts to Show Header on Scroll-Up */
$(function ($) {
    var MQL = 1170;
    var navbar = $(".navbar-custom");
    //primary navigation slide-in effect
    if ($(window).width() > MQL) {
        var headerHeight = navbar.height();
        $(window).on("scroll", {
                previousTop: 0
            },
            function () {
                var currentTop = $(window).scrollTop();
                //check if user is scrolling up
                if (currentTop < this.previousTop) {
                    //if scrolling up...
                    if (currentTop > 0 && navbar.hasClass("is-fixed")) {
                        navbar.addClass("is-visible");
                    } else {
                        navbar.removeClass("is-visible is-fixed");
                    }
                } else {
                    //if scrolling down...
                    navbar.removeClass("is-visible");
                    if (currentTop > headerHeight && !navbar.hasClass("is-fixed")) navbar.addClass("is-fixed");
                }
                this.previousTop = currentTop;
            }
        );
    }
});


/*  generate TOC */
if ($(".catalog-container").length > 0) {

    var bundleMap = {};

    var makeTitle = function (root) {
        var element = root._index == -1 ? $("<nav></nav>") : $("<li></li>");
        if (root._index != -1) {
            var id = Math.floor(Math.random() * 99999999);
            var href = $("<a></a>");
            href.attr("href", root.ref).text(root.text);
            bundleMap[id] = href;
            root.title.attr("id-ref", id);
            element.append(href);
        }
        var children = root.children;
        if (children.length > 0) {
            var list = $("<ul></ul>");
            for (var i = 0; i < children.length; i++) {
                var childEle = children[i];
                list.append(makeTitle(childEle));
            }
            element.append(list);
        }
        return element;
    };

    var wrap = function (data) {
        var map = {
            "-1": {
                "_index": -1,
                "children": []
            }
        };
        for (var i = 0; i < data.length; i++) {
            var title = data[i];
            var ref = $(title).attr("id");
            var text = $(title).text();
            var obj = {
                "ref": "#" + ref,
                "text": text,
                "_index": title._index,
                "children": [],
                "title": title
            };
            map[obj._index] = obj;
            map[obj._index - 1].children.push(obj);
        }
        return makeTitle(map[-1]);
    };

    var title_table = ["h2", "h3", "h4", "h5", "h6"];
    var postContainer = $(".post-container");
    if (postContainer.length > 0) {
        var children = [];
        postContainer.children().each(function () {
            var that = $(this);
            for (var i = 0; i < title_table.length; i++) {
                var index = title_table[i];
                if (that.is(index)) {
                    that._index = i;
                    that.attr("class", "bundle-h");
                    children.push(that);
                }
            }
        });
        var wrapper = wrap(children);
        $(".catalog-body").append(wrapper);
    }

    var height = Number($(".intro-header").height());

    $(".side-catalog").affix({
        offset: {
            top: function () {
                return height - 40;
            }
        }
    });
    $(".post-container .bundle-h").waypoint(function(direction) {
        var id = $(this.element).attr("id-ref");
        for (var x in bundleMap) {
            if (bundleMap.hasOwnProperty(x)) {
                bundleMap[x].css("color", x == id ? "red" : "inherit");
            }
        }
    })

}

function remote_serve() {
    /* Google Analytics Original */
    if (_gaId) {
        (function (i, s, o, g, r, a, m) {
            i["GoogleAnalyticsObject"] = r;
            i[r] = i[r] || function () {
                    (i[r].q = i[r].q || []).push(arguments)
                }, i[r].l = 1 * new Date();
            a = s.createElement(o),
                m = s.getElementsByTagName(o)[0];
            a.async = 1;
            a.src = g;
            m.parentNode.insertBefore(a, m)
        })(window, document, "script", "//www.google-analytics.com/analytics.js", "ga");

        ga("create", _gaId, _gaDomain);
        ga("send", "pageview");
    }

    /* Baidu Analytics Original */
    if (_baId) {
        (function () {
            var hm = document.createElement("script");
            hm.src = "//hm.baidu.com/hm.js?" + _baId;
            var s = document.getElementsByTagName("script")[0];
            s.parentNode.insertBefore(hm, s);

            // site auto push
            var bp = document.createElement("script");
            bp.src = "//push.zhanzhang.baidu.com/push.js";
            s = document.getElementsByTagName("script")[0];
            s.parentNode.insertBefore(bp, s);
        })();
    }

    /* 51.la Analytics Original*/
    if(_51laId) {
        (function () {
            var _script = document.createElement("script");
            _script.src = "http://js.users.51.la/" + _51laId + ".js";
            var s = document.getElementsByTagName("script")[0];
            s.parentNode.insertBefore(_script, s);
        })();
    }

    if (_duoshuo_name) {
        var ds = document.createElement('script');
        ds.type = 'text/javascript';ds.async = true;
        ds.src = (document.location.protocol == 'https:' ? 'https:' : 'http:') + '//static.duoshuo.com/embed.js';
        ds.charset = 'UTF-8';
        $("script:last").after(ds);
    }

}

