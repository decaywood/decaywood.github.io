/*!
 * Clean Blog v1.0.0 (http://startbootstrap.com)
 * Copyright 2015 Start Bootstrap
 * Licensed under Apache 2.0 (https://github.com/IronSummitMedia/startbootstrap/blob/gh-pages/LICENSE)
 */

// Tooltip Init
$(function() {
    $("[data-toggle='tooltip']").tooltip();
});


/* make all images responsive */
/* $(function() {
 	$("img").addClass("img-responsive");
 });*/

/* responsive tables */
$(document).ready(function() {
	$("table").wrap("<div class='table-responsive'></div>");
	$("table").addClass("table");
});

/* responsive embed videos */
$(document).ready(function () { 
    $('iframe[src*="youtube.com"]').wrap('<div class="embed-responsive embed-responsive-16by9"></div>');
	$('iframe[src*="youtube.com"]').addClass('embed-responsive-item');
    $('iframe[src*="vimeo.com"]').wrap('<div class="embed-responsive embed-responsive-16by9"></div>');
	$('iframe[src*="vimeo.com"]').addClass('embed-responsive-item');
});

/* Navigation Scripts to Show Header on Scroll-Up */
$(document).ready(function($) {
    var MQL = 1170;

    //primary navigation slide-in effect
    if ($(window).width() > MQL) {
        var headerHeight = $('.navbar-custom').height();
        $(window).on('scroll', {
                previousTop: 0
            },
            function() {
                var currentTop = $(window).scrollTop();
                //check if user is scrolling up
                if (currentTop < this.previousTop) {
                    //if scrolling up...
                    if (currentTop > 0 && $('.navbar-custom').hasClass('is-fixed')) {
                        $('.navbar-custom').addClass('is-visible');
                    } else {
                        $('.navbar-custom').removeClass('is-visible is-fixed');
                    }
                } else {
                    //if scrolling down...
                    $('.navbar-custom').removeClass('is-visible');
                    if (currentTop > headerHeight && !$('.navbar-custom').hasClass('is-fixed')) $('.navbar-custom').addClass('is-fixed');
                }
                this.previousTop = currentTop;
            });
    }
});



/* async load function */
function async(u, c) {
    var d = document, t = 'script',
        o = d.createElement(t),
        s = d.getElementsByTagName(t)[0];
    o.src = u;
    if (c) { o.addEventListener('load', function (e) { c(null, e); }, false); }
    s.parentNode.insertBefore(o, s);
}

/* Highlight.js */
async("//cdn.bootcss.com/highlight.js/9.0.0/highlight.min.js", function(){
    hljs.initHighlightingOnLoad();
});

/* fastclick */
async("//cdn.bootcss.com/fastclick/1.0.6/fastclick.min.js", function(){
    var $nav = document.querySelector("nav");
    if($nav) FastClick.attach($nav);
});


/* only load tagcloud.js in tag.html */
if($('#tag_cloud').length !== 0){
    async("/js/jquery.tagcloud.js",function(){
        $.fn.tagcloud.defaults = {
            //size: {start: 1, end: 1, unit: 'em'},
            color: {start: '#bbbbee', end: '#0085a1'},
        };
        $('#tag_cloud a').tagcloud();
    })
}


/* Night Mode */
$(document).ready(function () {

    /* Amaze UI cookie API */
    var store = $.AMUI.store;

    var loadMode = function (mode, text) {
        theme.attr('href', cssPath + mode);
        button.text(text);
        if(store.enabled) {
            store.set('mode', mode);
            store.set('text', text);
        }
    };

    var button = $('#night-mode');
    var theme = $('#theme');

    theme.mode = 'daily-mode.min.css';
    button.btnText = 'Night Mode';

    /* Amaze UI cookie API */

    if(store.enabled) {
        var localMode = store.get('mode');
        var localText = store.get('text');
        if(localMode && localText) {
            theme.mode = localMode;
            button.btnText = localText;
        }
    }
    loadMode(theme.mode, button.btnText);

    button.css('color', 'rgb(24, 149, 255)');
    button.hover(function () {
        button.css('cursor', 'pointer');
        button.css('color', 'rgb(24, 149, 155)');
    }, function () {
        button.css('color', 'rgb(24, 149, 255)');
    });

    var opposite = {
        'night-mode.min.css':'daily-mode.min.css',
        'daily-mode.min.css':'night-mode.min.css',
        'Night Mode':'Daily Mode',
        'Daily Mode':'Night Mode'
    };

    button.click(function () {
        theme.toggle(0, function () {
            theme.mode = opposite[theme.mode];
            button.btnText = opposite[button.btnText];
            loadMode(theme.mode, button.btnText);
        })
    })
});



/*  generate TOC */
if($('#toc').length > 0) {

    var makeTitle = function (root) {
        var element = root._index == -1 ? $('<div></div>') : $('<li></li>');
        if(root._index != -1) {
            var href = $('<a></a>').attr('href', root.ref).text(root.text);
            element.append(href);
        }
        //href.click(clickHandler);
        var children = root.children;
        if(children.length > 0) {
            var list = $('<ul></ul>');
            for (var i = 0; i < children.length; i++) {
                var childEle = children[i];
                list.append(makeTitle(childEle));
            }
            element.append(list);
        }
        return element;
    };

    var wrap = function (data) {
        var map = {'-1':{
            '_index' : -1,
            'children' : []
        }};
        for(var i = 0; i < data.length; i++) {
            var title = data[i];
            var ref = $(title).attr('id');
            var text = $(title).text();
            var obj = {
                'ref' : '#' + ref,
                'text' : text,
                '_index' : title._index,
                'children' : []
            };
            map[obj._index] = obj;
            map[obj._index - 1].children.push(obj);
        }
        return makeTitle(map[-1]);
    };

    $(document).ready(function () {
        var title_table = ['h2', 'h3', 'h4', 'h5', 'h6'];
        var postContainer = $('.post-container');
        if(postContainer.length > 0) {
            var children = [];
            postContainer.children().each(function () {
                var that = $(this);
                for(var i = 0; i < title_table.length; i++) {
                    var index = title_table[i];
                    if(that.is(index)) {
                        that._index = i;
                        children.push(that);
                    }
                }
            });
            var wrapper = wrap(children);
            $('#toc').after(wrapper);
        }
    });
}

/* Google Analytics Originial */
if(_gaId) {
    (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
            (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
        m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
    })(window,document,'script','//www.google-analytics.com/analytics.js','ga');

    ga('create', _gaId, _gaDomain);
    ga('send', 'pageview');
}

/* Baidu Tongji Originial */
if(_baId) {
    var _hmt = _hmt || [];
    (function() {
        var hm = document.createElement("script");
        hm.src = "//hm.baidu.com/hm.js?" + _baId;
        var s = document.getElementsByTagName("script")[0];
        s.parentNode.insertBefore(hm, s);
    })();
}