//MAP LINK //https://www.google.com/maps/dir/Current+Location/760+West+Genesee+Street+Syracuse+NY+13204
//TODO use getURLParameter('appName') for alt_return_url (PFF)

$(function () {
    $("[data-role='header']").toolbar();
    $('#popup').enhanceWithin().popup();
    $('#plainPopup').enhanceWithin().popup();
    $('#quickmenu').enhanceWithin().popup();
    $("body>[data-role='panel']").panel();
});

$(function () {

    $(document).on("pagecreate", function (event) {

        App['previousPage'] = App.currentPage;
        log('Creating page');
    })
});



window.pageHasLoaded = false;

/***********Settings (S) ***********/
var S = {
    //Default store ID
    storeId: 4719,
    //mobile and desktop view limit in pixels
    desktopViewMinWidth: 900,
    //mobile header image ration of this size 640 x 224
    slideShowRatio: 2.85714286,
    //platform string comes from native app (H_ANDROID_APP, H_IPHONE_APP)
    platform: 'WEB_APP',
    //Debug
    debug: false,
    //Click event
    click: 'vclick',
    useNativeMenu: false, //device.android() ? true : false,

    //Loading Times / Fade in/out time
    loadingFade: 200,
    loadingDelay: 200,
    //Production urls
    //serviceURL:		'http://ws.horecabestelapp.nl/HorecaAppService.svc/',

    init: function () {

        var url = window.location.hostname;

        //OLD if(url == 'localhost' || url.replace('http://','').replace('https://','').substring(0,5) == 'test-'){
//        if ((getURLParameter('force') == 'test' || url == 'localhost' || url == 'test-restaurants.horecabestelapp.nl') && getURLParameter('force') != 'real') {

//            //Test mode urls
//            this.debug = true,
//            //this.serviceURL		= 'http://test-ws.horecabestelapp.nl/HorecaAppService.svc/'

//            //Show TEST MODE image
//                    $('body').append('<img class="test-mode" src="/theme/UI/mobile/images/testmode.png" onclick="App.version()" />');
//        }

        this.urlSendOrder = Store.wsHost + '/SendOnlineOrder',
                this.urlCallMeBack = Store.wsHost + '/SendCallMeBackRequest',
                this.urlShiping = Store.wsHost + '/GetTimeSlotsForDeliveryOrPickup';
        this.getAttrib = Store.wsHost + '/GetProductAttributes';

        this.platform = getURLParameter('platform') || this.platform;

        if (window != window.top) {
            this.iframed = true;
        }

        if (getURLParameter('no-header')) {
            $('.header.desktop').hide();
        }

        if (getURLParameter('no-footer')) {
            $('.footer.desktop').hide();
        }
    }
};


/********************APP**********************/
var App = {

    init: function (id) {

        //$.removeCookie('products');
        log('( ͡° ͜ʖ ͡°)');
        //Get & Set store ID
        this.storeId = id; //getURLParameter('sid') != undefined ? getURLParameter('sid') : S.storeId;

        //Set payment status if any
        this.paymentStatus = getURLParameter('status') != undefined ? getURLParameter('status') : false;

        //Get window size
        App.getWindowSize();

        //Init some base variables
        this.cart = {};
        this.cart.products = {},
        this.cart.subtotal = 0,
        this.cart.discount = 0,
        this.cart.delivery = 0,
        this.cart.total = 0,
        this.state = 'loading',
        this.currentPage = 'home',
        this.previousPage = 'none',
        this.products = {},
        this.categories = {},
        this.customer = {},
        this.delivery = {},
        this.shipping = {},
        this.paymentID = {},
        //Dom
        this.$ = {};
        this.$.popup = $('#popup'),
       this.$.slogan = $('#slogan'),
        this.$.plainPopup = $('#plainPopup'),
        this.$.theSlideshow = $('#slideshow'),
        this.$.slideShow = $('#slideshow_wrapper'),
        this.$.loading = $('#loading'),
        this.$.overlay = $('#overlay'),
        this.$.menuCart = $('#menuKaart'),
        this.$.m_navigation = $('#m_navigation'),
        this.$.shippingMethods = $('#ShippingMethodId'),
        this.$.paymentMethod = $('#PaymentMethodId'),
        this.$.deliveryTime = $('#DeliveryDelay'),
        this.$.moneyBills = $('#moneyBills'),
        this.$.productPage = $('#product'),
        this.$.cartPage = $('#cart');
        this.$.orderPage = $('#orderform');
        this.$.xDialog = $('#xDialog');
        this.$.fixedHeader = $('#fixedHeader');
        this.$.cartTotal = $('.totals');//$('#cart').find('.totals');

        this.$.d_navigation = $('#d_navigation');

        //Create prduct page
        App.$.productPage.page();

        //Browser resize
        $(window).resize(function () {
            App.windowResizing()
        });


        if (S.debug)
            log('Loading data...');
        //if(S.debug && !ie) console.time("Loading complete");


        App
                ._buildTemplate()
                ._initShippingMethods();

        //Start
        App.start();
    },
    start: function () {

        log('App is starting');

        //Atach ajax events (START,STOP,ERROR)
        $(document).ajaxStart(function () {
            App.loading.start();
            log("Loading SHOW");
        });

        $(document).ajaxStop(function () {
            App.loading.stop();
            log("Loading HIDE");
        });

        if (S.debug) {
            $(document).ajaxError(function (event, jqxhr, settings, thrownError) {
                //App.msg.show('Error');
                log(thrownError, 'error');
                log(event, 'error');
                log(jqxhr, 'error');
                log(settings, 'error');
            })
        }

        //Init jquery mobile with default homepage
        window.location.hash = '#home', $.mobile.initializePage();

        //Buid list view
        App.buildListView();

        //Load saved products
        //App._loadCartFromCookie();
        //Used in iOS and Android WEBVIEW
        if (S.platform === 'H_ANDROID_APP')
            location.href = 'app://pageHasLoaded';
        else
            window.pageHasLoaded = true;

        App.logger();

        //_locationCheckService start
        App._locationCheckService();

        //Update cart content
        App.updateCartHtml();

        //Load Customer saved inputs
        Customer.loadInput();

        //if cookie Get delivery data from ws
        //if(App.customer.Housenumber && App.customer.Zip) App._getDeliveryData();
        //if(!$.isEmptyObject(App.delivery)) App._getDeliveryData();

        //Fire resize function
        App.windowResized(true);

        if (Store.ALLOWORDERING == false) {

            App.msg.show('<img src="/theme/UI/mobile/images/gesloten.png" />', 'gesloten');

            //App.msg.show('Dit restaurant accepteert geen bestellingen en dient enkel voor informatieve doeleinde. Bestellingen worden NIET bezorgd..');
        }

        setTimeout(function () {

            App.msg.checkQuery();
            //App.msg.show('<img src="/theme/UI/mobile/images/gesloten.png" />', 'gesloten');
        }, 1000);

        log('App is started');

        setTimeout(function () {
            $(window).scroll(function () {
                var m = $('.ui-page-active').offset();
                if (m && App.view == 'desktop') {

                    if ($(window).scrollTop() > m.top) {
                        $('.desktop.leftpan, body.desktop .rightpan').css('top', $(window).scrollTop() - m.top);
                    } else {
                        $('.desktop.leftpan, body.desktop .rightpan').css('top', 0);
                    }
                }
            });
        }, 500)
    },
    setStore: function (store) {
        this.store = store;
        return this;
    },
    _buildTemplate: function () {

        //SlideShow
        App._buildSlideShow();

        //Fill Delivery Times Selectbox
        App._fillSelectBox('deliveryTime', ['Geen optie']/*Store.PossibleDeliveryTimeSlots*/, function (o) {
            return { name: o, value: o };
        });


        //Fill Payment Methods Selectbox
        /*App._fillSelectBox('paymentMethod', Store.PaymentMethods.reverse(), function(o){
         return {name: o.PaymentMethodName, value: o.PaymentMethodId};
         });*/

        $.id('orderformBTN').on('click', function () {

            if (App.view == 'desktop' && App.currentPage == 'orderform') {

                App.sendOrder();
            } else {
                $.mobile.navigate('#orderform');
            }
        })


        App.$.paymentMethod.on('change', function () {

            App.paymentID = $(this).val();

            if (App.paymentID == 2) {

                $.id('paymentCost').html(App.intToPrice(1));
                $.id('cashAmountDiv').hide();
                $.id('issuersBox').show();

            } else {

                $.id('paymentCost').html('');

                App._fillSelectBox('moneyBills', moneyBills(App.cart.total), function (o) {
                    return { name: o.name, value: o.value.toFixed(2) };
                });

                $.id('issuersBox').hide();
                $.id('cashAmountDiv').show();
            }

        }).change();


        // Send Order
        $.id('sendOrder').on(S.click, function (e) {

            e.preventDefault();
            App.sendOrder();

            /*
            var error = false;
            //$(this).find('.required').removeClass('error');

            $(this).find('.required').each(function () {

                if ($(this).attr('name') && $.trim($(this).val()) === '') {
                    error = true;
                    $(this).addClass('error');
                }
            });


            if (error) {

                //We can fire some allert message here
                App.msg.show('Error');

            } else {

                //App.loading.start();
                
            }*/

            return false;
        });


        // Add Cart Icon
        $.id('quickmenuBTN').on(S.click, function () {

            $('#quickmenu').popup("open", {
                positionTo: "window",
                transition: "pop"
            });
        });

        //TODO REMOVE OR FIX THIS
        App.$.productPage.on(S.click, 'a.add', function () {

            var
                    attributes = {},
                    p_id = App.$.productPage.data('id');


            $(this).closest('.ui-page').find('select').each(function () {

                var
                        a_id = $(this).attr('name'),
                        o_id = $(this).val();

                if (o_id) {

                    attributes[a_id] = {
                        name: Store.products[p_id].attributes[a_id].name,
                        options: {}
                    };


                    if (typeof o_id !== 'string') {

                        $.each(o_id, function (i, id) {
                            attributes[a_id].options[id] = Store.products[p_id].attributes[a_id].options[id];
                        });

                    } else {

                        attributes[a_id].options[o_id] = Store.products[p_id].attributes[a_id].options[o_id];
                    }
                }
            });


            //Add to pending products
            App['penndingProduct'] = { productid: p_id, attributes: attributes };

            //App.$.popup.popup("close");
            $.mobile.navigate('#home');
        });


        //Call me back
        $('.callMeBtn').css('display', 'block');

        $.id('callMeBtnSend').on('vclick', function () {

            //Ajax params
            var params = {
                'storeId': App.storeId,
                'phoneNumber': $('#phonecallmeback').val()
            };

            $.get(S.urlCallMeBack, params).done(function (data) {

                if (data == "SUCCESS") {
                    App.msg.show('U wordt terug gebeld.', 'default', false, "$.mobile.navigate('#home');");
                } else {
                    App.msg.show('Phone number error')
                }
            });
        });


        App.$.cartPage.find('.orderlist').on('change', 'input', function () {

            var
                    value = parseInt($(this).val());
            item = $(this).closest('li').data();

            if (value >= 0) {

                App.changeCartProductQuantity(item.id, item.index, value, true);
                //$(this).children(':selected').prop("selected", false);
            }
        });


        /*App.$.cartPage.find('.orderlist').on('change', 'select', function(){

         var
         value = $(this).val();
         item	= $(this).closest('li').data();

         if(value == 'del'){

         //$(this).children(':selected').prop("selected", false);
         App.removeFromCart(item.id, item.index);

         }else if(value){

         App.changeCartProductQuantity(item.id, item.index, value, 1, true);
         $(this).children(':selected').prop("selected", false);
         }
         });*/


        return this;
    },
    _buildSlideShow: function () {
        //width: 11800px; left: 0px; display: block; transition: all 400ms ease 0s; transform: translate3d(-4720px, 0px, 0px);
        //

        //App.$.slideShow.children(':first').addClass('active');
        this.slides = App.$.slideShow.children('.item').length - 1;
        this.currentSlide = 0;


        // Navigate to the next page on swipeleft
        App.$.slideShow.on("swipeleft", function (event) {

            if (App.currentSlide < App.slides) {

                App['currentSlide'] += 1;

                //App.$.slideShow.css('transform', 'translate3d(-'+(App.window.width * App.currentSlide)+'px, 0px, 0px)');
                TweenLite.to(App.$.slideShow, 0, { x: (-1 * (App.slideShowWidth * App.currentSlide)), y: 0, z: 0 });

                //console.log(App.window.width, App.currentSlide);
            }
        });

        // Navigate to the next page on swipeleft
        App.$.slideShow.on("swiperight", function (event) {

            if (App.currentSlide > 0) {

                App['currentSlide'] -= 1;

                //App.$.slideShow.css('transform', 'translate3d(-'+(App.window.width * App.currentSlide)+'px, 0px, 0px)');
                TweenLite.to(App.$.slideShow, 0, { x: (-1 * (App.slideShowWidth * App.currentSlide)), y: 0, z: 0 });
                //console.log(App.window.width, App.currentSlide);
            }
        });

        setInterval(function () {

            if ("home" == App.currentPage) {

                if (App.currentSlide < App.slides) {

                    App.$.slideShow.trigger("swipeleft");

                } else {

                    App['currentSlide'] = 0;
                    //App.$.slideShow.css('transform', 'translate3d(0px, 0px, 0px)');
                    TweenLite.to(App.$.slideShow, 0, { x: 0, y: 0, z: 0 });
                }

            }
        }, 6000);

        /*
         App.$.slideShow.children(':first').addClass('active');


         // Navigate to the next page on swipeleft
         $(App.$.slideShow).on("swipeleft", function(event){

         var item = App.$.slideShow.children('.active');
         var next = item.next().length ? item.next() : App.$.slideShow.children(':first');

         next.css({
         'left':App.$.slideShow.width()
         }).addClass('next');


         next.animate({'left': 0}, 200, function(){

         item.removeClass('active');//, next.addClass('active');
         next.attr("class", "item active");

         });
         });

         // Navigate to the next page on swipeleft
         $(App.$.slideShow).on("swiperight", function(event){


         var item = App.$.slideShow.children('.active');
         var next = item.prev().length ? item.prev() : App.$.slideShow.children(':last');

         next.css({
         'left': '-' + App.$.slideShow.width() + 'px'
         }).addClass('next');


         next.animate({'left': 0}, 200, function(){

         item.removeClass('active');//, next.addClass('active');
         next.attr("class", "item active");

         });
         });

         setInterval(function(){

         if("home" == App.currentPage){

         $(App.$.slideShow).trigger("swipeleft");
         }
         }, 4800);*/
    },


    buildListView: function () {


        App.$.m_navigation.find('.collapsible').collapsible({
            //collapsed: false

        }).on('collapsibleexpand', function () {

            //Set as current opened element
            App.current = this.id;

            //Close old collapsible
            App.$.m_navigation.find('.open').collapsible("collapse");

            //Add class to clicked one
            $(this).addClass('open');


            if ('mobile' == App.view) {

                $(this).children().next().stop().hide().slideDown(340);

                //Scroll
                App.scrollToCategory(this);

            } else {
                $(this).children().next().show();
            }

            /*//Slide down element
             $(this).children().next().stop().hide().slideDown(240);

             //Scroll
             App.scrollTo(this);*/

        }).on('collapsiblecollapse', function (event) {

            $(this).removeClass('open').children().next().hide();//.stop().slideUp(200);

            //Some bad fix :/
            if ('desktop' == App.view && $(this).is("#" + App.current)) {
                $(this).collapsible("expand");
            }
        });

        //Build listview
        App.$.m_navigation.listview();

        //Desktop navigation click
        App.$.d_navigation.on('click', 'a', function () {

            //if not homepage then change it
            if (App.currentPage != 'home') {
                $(":mobile-pagecontainer").pagecontainer("change", "#home");
            }

            $.id($(this).attr('rel')).collapsible("expand");

            App.scrollTo(App.$.m_navigation.find('.open'));
        });

        //Clicked product with Attributes
        App.$.m_navigation.on(S.click, 'a.ha', function () {
            App.prepareProductPage($(this).data('id'));
        });

        //Clicked product without Attributes
        App.$.m_navigation.on(S.click, 'a.na', function () {
            App.addToCart($(this).data('id'), {});
        });
    },
    scrollTo: function (item, callback) {

        if (typeof item != 'undefined') {

            var offset = $(item).offset();
            if (offset) {
                $('html, body').animate({
                    scrollTop: offset.top - $.id('home').children('.ui-header').height()
                }, 300, function () {

                    //Fire Callback
                    if (typeof callback === 'function')
                        callback(item);
                });
            }

        } else {
            log('scrollTo item missing');
        }
    },
    _fillSelectBox: function (item, data, objFn) {

        var html = '';

        $.each(data, function (i) {

            var obj = objFn(this);

            if (obj.value || obj.value === false) {
                obj.selected = i === 0 ? 'selected="selected"' : '';
                html += TPL.option.compose(obj);
            }
        })

        //Add to selectbox
        App.$[item].html(html);//.selectmenu("refresh");

        //refresh if selectmenu is initiated
        if (App.$[item].data('mobile-selectmenu') !== undefined)
            App.$[item].selectmenu('refresh');

        return this;
    },
    _initShippingMethods: function () {

        /*var html = '';

         $.each(Store.ShippingMethods, function(i){

         html += TPL.radioBTN.compose({
         index:	i,
         name:		'shippingMethod',
         value:	this.ShippingMethodId,
         text:		this.ShippingMethodText,
         checked:	i===0 ? 'checked="checked"' : ''
         })
         });

         //Add to selectbox
         App.$.shippingMethods.html(html);*/

        App.$.shippingMethods.on('change', function () {

            //Set shipping
            App.shipping = $(this).val();

            //Hide/Show address
            App.$.orderPage.find('.advanced').css('display', App.shipping == 1 ? 'block' : 'none');

            $.ajax({
                url: S.urlShiping,
                type: "GET",
                dataType: "json",
                timeout: 3800,
                data: {
                    'storeId': App.storeId,
                    'shipmentmethodid': App.shipping
                },
                success: function (data) {

                    if (data.HasTimeSlots == true) {

                        //Rebuild(Fill) Delivery Times Selectbox
                        App._fillSelectBox('deliveryTime', data.MessageBody, function (o) {
                            return { name: o, value: o };
                        });

                        /*
                        if(data.MessageBody.length){

                            //Rebuild(Fill) Delivery Times Selectbox
                            App._fillSelectBox('deliveryTime', data.MessageBody, function(o){
                                return {name: o, value: o};
                            });

                        }else{

                            var msgtext = (App.shipping == 1 ? 'Bezorging' : 'Afhalen') + ' optie is niet beschikbaar voor vandaag';

                            //Rebuild(Fill) Delivery Times Selectbox
                            App._fillSelectBox('deliveryTime', [msgtext], function(o){
                                return {name: o, value: false};
                            });
                        }*/

                    } else {
                        App.msg.show(data.MessageBody[0]);
                    }


                    //Change Time Slots Title
                    //var timeslotsTitle = App.shipping == 1 ? 'Bezorging' : 'Afhalen';
                    //App.$.orderPage.find('.timeslotsTitle').text(timeslotsTitle);

                    App.updateCartHtml();
                },
                error: function (x, t, m) {
                    //App.loading.stop();
                    if (t === "timeout") {
                        //App.msg.show("Request timeout. rq is slower than 4 seconds");
                        App.$.shippingMethods.change();
                    } else {
                        //App.msg.show(t);
                    }
                }
            });
        });

        return this;
    },
    _getDeliveryData: function (renew, callback) {

        //App.loading.start();

        Customer.getInput();

        //Ajax params
        var params = {
            'storeId': App.storeId,
            'postcode': App.customer.Zip,
            'number': App.customer.Housenumber,
            'distance': 0//renew ? 0 : App.delivery.data.distance
        };

        $.getJSON('/json/postcode/', params).done(function (response) {

            if (response.status) {

                App['delivery'] = response;

                //Save delivery to cookie
                $.cookie('delivery', JSON.stringify(App.delivery), { path: '/' });

            } else if (response.status === false) {

                App['delivery'] = response;
            }


            /*if(!renew){
             data.city	= App.customer.City;
             data.street	= App.customer.Address;
             }*/

            if (typeof callback == 'function')
                callback(response);
        })

                .always(function () {
                    //App.loading.stop();
                })


                //kaji mi nenormalen li sym spored teb? poznavash li nqkoi drug koito da moje da pishe takiva gluposti
                .fail(function () {
                    App.msg.show('Delivery Address Error');
                });
    },
    logger: function () {

        //Ajax params
        var params = {
            'sid': Store.id,
            'logo': Store.logo,
            'tag': 'start',
            'msg': 'Started successfully'
        };


        //$.getJSON('/json/logger/', {'data': JSON.stringify(params)});
    },
    addToCart: function (p_id, attributes) {

        var
                productIndex = false, //false for unique product, integer for existing product
                startTag = App.$.m_navigation.find("a[data-id='" + p_id + "']"),
                endTag = $.id('cartBTN');


        //End tag destination
        if (App.view == 'mobile') {

            //Mobile Cart button
            endTag = $.id('cartBTN');

        } else {

            //After last product
            if ($('#shoppingCart li.product:last').next().length)
                endTag = $('#shoppingCart li.product:last').next();

                //Desktop version of cart counter
            else
                endTag = $('#shoppingCart').find('.mini-cart');
        }


        if (App.cart.products[p_id] == undefined) {

            //Set product id if not exists
            App.cart.products[p_id] = [];

        } else {

            //Check if products with same attributes exists
            $.each(App.cart.products[p_id], function (i) {

                if (JSON.stringify(this.attributes) === JSON.stringify(attributes)) {

                    productIndex = i;

                    var endTagProduct = $.id('shoppingCart').find('li[data-id="' + p_id + '"][data-index="' + productIndex + '"]');

                    //Change end destination desktop view only
                    if ('desktop' === App.view && 'ready' === App.state && endTagProduct.length) {
                        endTag = endTagProduct;//$.id('shoppingCart').find('li[data-id="'+productId+'"][data-index="'+productIndex+'"]');
                    }

                    return;
                }
            })
        }


        //add quantity to existing product
        if (productIndex !== false) {

            App.changeCartProductQuantity(p_id, productIndex, null, false);

            //add new
        } else {

            //App cart data
            App.cart.products[p_id].push({
                attributes: attributes,
                qnt: 1
            });
        }

        //Animate then update cart html
        $.when(App.animateFromTo(startTag, endTag)).then(function () {

            //Run updates
            //App.updateCookie();
            App.updateCartHtml();

        });
    },
    //it can be the smallest thing in the world for the world itself, but it can be the world for those who feel it
    cartProductExists: function (id, i) {

        if (typeof App.cart.products[id] !== undefined && typeof App.cart.products[id][i] !== undefined) {
            return true;
        } else {
            return false;
        }
    },
    removeFromCart: function (id, i) {

        if (id === 'all') {

            //Remove all products from cart
            this.cart.products = {};
            //App.updateCookie();

        } else {

            //Remove product from array
            App.cart.products[id].splice(i, 1);

            //if empty delete object property
            if (App.cart.products[id].length === 0)
                delete this.cart.products[id];
        }

        //Run updates
        //App.updateCookie();
        App.updateCartHtml();
    },
    changeCartProductQuantity: function (id, i, newQnt, update) {

        if (App.cartProductExists(id, i)) {

            if (newQnt === null)
                newQnt = (this.cart.products[id][i].qnt + 1);

            if (newQnt > 0) {

                //Add amount to quantity
                this.cart.products[id][i].qnt = newQnt;

                if (update) {

                    //Run updates
                    //App.updateCookie();
                    App.updateCartHtml();
                }

            } else if (newQnt === 0) {

                //Remove product because end result will be less than 1
                App.removeFromCart(id, i);
            }
        }
    },
    updateCartHtml: function () {

        //if App state is ready then show the cart
        //if(App.state === 'ready'){


        App.cart.subtotal = 0,
                App.cart.discount = 0,
                App.cart.total = 0;
        App.cart.delivery = 0;

        var products = App.collectCartProducts();

        //Products counter
        $('.productCount').text(products.count);

        //Show products
        $('.shoppingCart ul').html(products.output);

        //Clear totals UL
        App.$.cartTotal.empty();

        //If there is discount option
        //if(Store.discount.amount > 0 && App.cart.total > 0){
        if (Store.discount.amount > 0 && App.cart.total >= Store.discount.min) {

            //Calculate discount amount
            App.cart.discount = Store.discount.usePercent ? App.cart.subtotal * Store.discount.amount : Store.discount.amount;

            //Append discount
            App.$.cartTotal.append(TPL.totalRow.compose({
                title: 'Korting over ' + App.intToPrice(App.cart.subtotal),
                price: App.intToPrice(-Math.abs(App.cart.discount))
            }));

            //Subtract discount from total
            App.cart.total -= App.cart.discount;
            App.cart.subtotal -= App.cart.discount;

            //Append subtotal
            App.$.cartTotal.append(TPL.totalRow.compose({
                title: 'Subtotaal',
                price: App.intToPrice(App.cart.subtotal)
            }));

        } else if (App.shipping == 1) {

            //Append subtotal
            App.$.cartTotal.append(TPL.totalRow.compose({
                title: 'Subtotaal',
                price: App.intToPrice(App.cart.subtotal)
            }));
        }


        //If shipping then display delivery cost
        if (App.shipping == 1) {

            var
                    price = 'Te Rekenen';//'TBC',
            //distance = '';

            //Big calc
            if (App.delivery.status) {

                if (App.cart.subtotal >= App.delivery.data.freeAbove) {

                    App.cart.delivery = 0;
                    price = 'GRATIS';

                    //}else if(App.delivery.data.freeAbove > App.cart.subtotal && App.cart.subtotal > App.delivery.minOrder){
                } else {

                    App.cart.delivery = App.delivery.data.cost;
                    price = App.intToPrice(App.delivery.data.cost);
                }

            }

            App.$.cartTotal.append(TPL.totalRow.compose({
                title: 'Bezorgkosten',
                price: price
            }));

            //Add cart delivery to total
            App.cart.total += App.cart.delivery;

            //$.id('distance').html(distance);
            //$.id('deliveryCost').html(price);

            //Add grand total
            App.$.cartTotal.append(TPL.totalRow.compose({
                title: 'Totaal',
                price: App.intToPrice(App.cart.total)
            }));

        } else if (App.shipping == 2) {

            //Add grand total
            App.$.cartTotal.append(TPL.totalRow.compose({
                title: 'Totaal',
                price: App.intToPrice(App.cart.total)
            }));


            var address = Store.PUBLICADDRESS;
            address = address.replace(/<br>/i, ", ");
            address = address.replace(/<br>/gi, " ");

            App.$.cartTotal.append(TPL.totalRow.compose({
                title: 'Afhalen',
                price: address,
                cssclass: 'grey'
            }));
        }

        //Hide order buttons
        $('.orderImpossible, .orderPossible').hide();

        if (Store.STOREISOPENNOW == false) {// && S.debug == false
            //console.log('store open false');
            $('#orderForm').hide();
            $('.orderImpossible').text('Restaurant gesloten (' + Store.OpenCloseTimes[0].OpenFrom + ' open)').css('cursor', 'not-allowed').css('display', 'block').show();

            /*}else if(Store.id == 7294 && App.cart.subtotal < 15){

             $('#orderForm').hide();
             $('.orderImpossible').html('Minimum orderbedrag (' + App.intToPrice(20) + ')').css('cursor', 'text').css('display', 'block').show();

             //}else if(Store.MINIMUMORDERAMOUNT > (totals.Totaal -totals.Bezorgkosten)){
             */
                 //}else if(App.shipping == 1 && (App.cart.total - App.cart.delivery) <= App.delivery.data.minOrder){

                 $('#orderForm').hide();
                 //$('.orderImpossible').html('Minimum orderbedrag (' + App.intToPrice(Store.MINIMUMORDERAMOUNT) + ')').css('cursor', 'text').css('display', 'block').show();
                 $('.orderImpossible').html('Minimum orderbedrag (' + App.intToPrice(App.delivery.data.minOrder) + ')').css('cursor', 'text').css('display', 'block').show();

                 /*}else if(Store.ALLOWPREORDER == true){
     
                  $('.orderPossible').css('display', 'block').show();
     
                  */

                 $('.orderPossible').css('display', 'block').show();
             }


        $.cookie('products', JSON.stringify(App.cart.products), { path: '/' });
    },
    collectCartProducts: function () {

        var
                row = 0,
                result = {
                    orderLines: [],
                    output: '',
                    count: 0
                }

        $.each(App.cart.products, function (id, productGroup) {

            $.each(productGroup, function (i, product) {

                if (Store.products[id] != undefined) {

                    var
                            attributesArray = [],
                            attributesHtml = '',
                            price = (Math.round((Store.products[id].price) * 100) / 100);

                    //Cart product attributes
                    $.each(product.attributes, function (a_id, attribute) {

                        if (typeof attribute.options == 'object' || typeof attribute.options == 'array') {

                            $.each(attribute.options, function () {

                                attributesArray.push({
                                    Description: this.name,
                                    Priceinfluence: this.price
                                });


                                price += this.price ? this.price : 0;

                                attributesHtml += TPL.cartAttributeItem.compose({
                                    name: attribute.name,
                                    option: this.longName
                                });
                            });
                        }
                    });


                    //Add product and his attributes to output variable
                    result.output += TPL.cartProduct.compose({
                        image: Store.products[id].image,
                        name: Store.products[id].name,
                        price: App.intToPrice(price * product.qnt),
                        attribs: attributesHtml,
                        qnt: product.qnt,
                        id: id,
                        i: i
                    });


                    result.orderLines.push({
                        CategoryName: '', //Store.products[id].Products.CATEGORYPARENTNODETEXT,
                        ProductName: Store.products[id].Name,
                        OaE: attributesArray,
                        Qty: product.qnt,
                        Price: price,
                        PlaceID: row,
                        PlaceName: row,
                        ProductID: id,
                    });


                    //Add to total
                    //totals.Totaal += price * product.qnt
                    App.cart.subtotal += price * product.qnt;
                    App.cart.total += price * product.qnt;


                    //Count products
                    result.count += product.qnt;
                    row++;
                }
            })
        });

        if (result.output == '') {
            result.output += '<li class="big">U heeft geen producten gekozen, maak eerst uw keuze</li>';
        }

        return result;//{'count': productCount, 'output': output}
    },
    sendOrder: function () {

        var valid = App.validate();

        if (valid && (App.delivery.status || App.shipping === '2')) {

            var
                    row = 0,
                    orderLines = [];

            //App.loading.start();

            //Loop products in cart
            $.each(App.cart.products, function (p_id, productGroup) {

                $.each(productGroup, function (i, product) {

                    if (Store.products[p_id] != undefined) {

                        var
                                attributesArray = [],
                                price = (Math.round((Store.products[p_id].price) * 100) / 100);

                        //Cart product attributes
                        $.each(product.attributes, function (a_id, attribute) {

                            $.each(attribute.options, function (o_id, option) {

                                attributesArray.push({
                                    Description: option.name,
                                    Priceinfluence: option.price
                                });

                                price += option.price;
                            })
                        });

                        orderLines.push({
                            CategoryName: Store.products[p_id].c_name, //'WAZAAAAP',//Store.products[id].Products.CATEGORYPARENTNODETEXT,
                            ProductName: Store.products[p_id].name,
                            OaE: attributesArray,
                            Qty: product.qnt,
                            Price: price,
                            PlaceID: row,
                            PlaceName: row,
                            ProductID: p_id,
                        });
                        row++;
                    }
                })
            });

            var order = new Order(orderLines);

            var data = $.extend({}, Customer.getInput(), order);
            Customer.saveInput();


            //Save delivery DATA
            $.cookie('delivery', JSON.stringify(App.delivery), { expires: 30, path: '/' });

            if (true /*order.DeliveryDelay != 'false'*/) {

                $.ajax({
                    type: "POST",
                    url: S.urlSendOrder,
                    data: JSON.stringify({ 'order': data }),
                    contentType: "application/json; charset=utf-8",
                    dataType: "JSON"
                })


                    .done(function (response) {

                        //If we have order number
                        if (parseInt(response.OrderId) > 0) {

                            if (response.Result == "OK" && $.trim(response.RedirectToUrl) == "") {

                                App.msg.show('Uw bestelling is succesvol geplaats, bedankt voor uw bestelling!', 'default', false, "$.mobile.navigate('#home');");
                                App.removeFromCart('all');
                                //$.mobile.navigate('#home');

                            } else {

                                //location.href = $.trim(response.RedirectToUrl);
                                //window.open($.trim(response.RedirectToUrl), '_blank');

                                App.msg.show('<a href="' + $.trim(response.RedirectToUrl) + '"><img src="/theme/UI/mobile/images/goToiDeal.png" /></a>', 'gesloten', true);

                                App.$.popup.trigger('refresh').popup("open", {
                                    //App.$.popup.enhanceWithin().popup("refresh").popup("open", {
                                    positionTo: "window",
                                    transition: "slideup"
                                });

                                //App.$.popup.find('img:first').click();
                                //redirect to PFF url
                                //App.msg.show(response.RedirectToUrl);
                            }

                        } else {
                            //Alert the error
                            App.msg.show(response.Result);
                        }
                        //console.log(response);
                    })

                    .always(function () {
                        //App.loading.stop();
                    });
            } else {
                App.msg.show($.trim($.id('DeliveryDelay').find(':selected').text()));
            }

        } else if (valid) {

            App.msg.show(App.delivery.msg);
        }
    },
    prepareProductPage: function (id) {


        $.ajax({
            url: S.getAttrib,
            type: "GET",
            dataType: "json",
            timeout: 3800,
            data: {
                //'storeId'			: App.storeId,
                'productNumber': Store.products[id].number
            },
            success: function (data) {

                App.showProductPage(id, data);
            },
            error: function (x, t, m) {
                if (t === "timeout") {
                    App.prepareProductPage(id);
                } else {
                    //App.msg.show(t);
                }
            }
        });
    },
    showProductPage: function (p_id, attributes) {

        //p_id product ID
        //a_id attribute ID
        //o_id attribute option ID

        //Set product attribute property
        Store.products[p_id]['attributes'] = {};
        Store.products[p_id]['attributesOrder'] = [];


        //Sort
        attributes.sortBy('DISPLAYORDER');

        //attributesHtml
        var attributesHtml = '';

        //Loop attributes to create select boxes
        $.each(attributes, function () {

            this.selected = '';

            var
                    a_id = this.PRODUCTATTRMAPID,
                    that = new Attribute(this);


            Store.products[p_id]['attributes'][a_id] = that;
            Store.products[p_id]['attributesOrder'].push(a_id);

            //options string with empty option or just empty string
            var optionsHtml = that.isRequired == false ? TPL.option.compose({}) : '';


            //Is there any option that is selected by default
            var defaultSelected = $.grep(this.ProductAttrValues, function (e) {
                return e.ISDEFAULTSELECTED == true;
            }).length;

            //Loop values to create options
            $.each(that.optionsOrder, function (index, o_id) {

                if (defaultSelected === 0) {
                    that.options[o_id].selected = 'selected="selected"';
                    defaultSelected = 1;
                }

                optionsHtml += TPL.option.compose({
                    selected: that.options[o_id].selected,
                    name: that.options[o_id].longName,
                    value: o_id
                });
            });

            attributesHtml += TPL.attributeItem.compose({
                id: a_id,
                title: that.name,
                nativeMenu: S.useNativeMenu, //true,//this.CONTROLTYPEID > 2 ? false : true,
                selectType: that.type > 2 ? 'multiple="multiple"' : '',
                options: optionsHtml
            });
        });

        //Product page content
        App.$.productPage.children('.ui-content').html(
                TPL.productPopupItem.compose({
                    attributeItems: attributesHtml,
                    productid: p_id
                })
            );

        //Add product image
        App.$.productPage.find('.product-image').css('background-image', 'url("' + Store.products[p_id].image + '")');

        //Price + label background
        var priceLabel = App.$.productPage.find('.product-price').html(
                //Price
                App.intToPrice(Store.products[p_id].price)

                //Image
                //TPL.img.compose({
                //src: Store.StyleSettings.PriceLabelImageUrl
                //})
                );

        //Set product name
        App.$.productPage.find('.product-name').html(Store.products[p_id].name);

        //App.$.slideShowWrapper.children('.product-header').show();

        //App.$.productPage.find('select').fullselectmenu();
        App.$.productPage.find('select').selectmenu();

        //App.$.productPage.find('select').xSelect();

        App.$.productPage.children('.ui-content').append(
                '<div class="ui-grid-a footer-navigation">' +
                '<div class="ui-block-a">' +
                '<a href="#" data-rel="back" class="btnCancel ui-btn ui-shadow ui-corner-all">Annuleren</a>' +
                '</div>' +
                '<div class="ui-block-b">' +
                '<a href="#" class="add btnOk custom-btn ui-btn ui-shadow ui-corner-all">Toevoegen</a>' +
                '</div>' +
                '</div>'
                );

        //Add product id to page
        App.$.productPage.data('id', p_id);
        //console.log('AFTER', Store.products[p_id]);
        //Go to product page (page #products)
        $.mobile.navigate(App.$.productPage.selector);
    },
    loading: {
        start: function () {
            if (this.timeout)
                clearTimeout(this.timeout);
            this.timeout = setTimeout(function () {
                App.$.loading.fadeIn(S.loadingFade);
            }, S.loadingDelay);
        },

        stop: function () {
            if (this.timeout)
                clearTimeout(this.timeout);
            App.$.loading.fadeOut(S.loadingFade);
        }
    },
    /*deleteAllProducts: function(){

     //TODO

     },*/


    msg: {
        _query: [],
        _isOpen: true,
        show: function (text, type, hideButton, func) {

            if (App.msg._query.length || App.msg._isOpen) {

                //Add to msg query
                App.msg._query.push({
                    text: text,
                    type: type || 'default',
                    func: func || false,
                    hideButton: hideButton || false
                });

            } else {

                //Show the message
                App.msg._open(text, type || 'default', hideButton || false, func || false);
            }
        },
        //Used in JQM popup afterclose event
        checkQuery: function () {

            App.msg._isOpen = false;
            //$('body').css('overflow','scroll');

            if (App.msg._query.length) {

                App.msg._open(
                        App.msg._query[0].text,
                        App.msg._query[0].type,
                        App.msg._query[0].func,
                        App.msg._query[0].hideButton
                        );

                App.msg._query.splice(0, 1);
            }
        },
        _open: function (text, type, hideButton, func) {
            //console.log(func);
            App.msg._isOpen = true;
            //$('body').css('overflow','hidden');

            var content;
            if (func) {

                content = text;
                if (hideButton != true)
                    content += '<a href="#" data-role="none" onclick="' + func + '" class="ui-btn ok">OK</a>';

            } else {

                content = text;
                if (hideButton != true)
                    content += '<a href="#" data-role="none" data-rel="back" class="ui-btn ok">OK</a>';
            }

            App.$.popup.children('.ui-content').attr("class", "ui-content " + type).html(content);

            //TODO CHECK THIS
            App.$.popup.trigger('refresh');

            App.$.popup.popup("open", {
                positionTo: "body", //"window",
                tolerance: "0,0",
                transition: "pop"
            });
        }
    },
    _loadCartFromCookie: function () {
        App.cart.products = $.cookie('products') ? JSON.parse($.cookie('products')) : {};

    },
    intToPrice: function (price) {

        var mathSign = price < 0 ? '- ' : '';

        //No need for 4 digid price format
        return mathSign + "&euro;" + Math.abs(price).toFixed(2).replace('.', ',');
    },
    toTitleCase: function (str) {
        return str.replace(/\w\S*/g, function (txt) {
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        });
    },
    _locationCheckService: function () {

        var postCode = $.id('Zip');

        if ($.isEmptyObject(App.delivery)) {

            App['delivery'] = {
                status: false,
                msg: 'Postcode is verplicht',
                data: {
                    minOrder: 0
                }
            }
        }


        postCode.blur(function () {

            $(this).val($(this).val().replace(/ /g, "").toUpperCase());

            var inputPostCode = postCode.val();

            if (inputPostCode.length >= 4 && inputPostCode.length <= 6) {

                //Get delivery data for new address
                App._getDeliveryData(true, function (response) {

                    if (response.status) {

                        $('#Zip').removeClass('error');
                        $.id('street').val(response.data.street);
                        $.id('city').val(response.data.city);

                        //App.calculateDeliveryCost();
                        App.updateCartHtml();

                    } else {

                        App.msg.show(response.msg);
                        App.updateCartHtml();
                        //App.msg.show(data.message);
                        $('#Zip').addClass('error');
                    }
                })
            }
        })
    },
    scrollToCategory: function (item) {

        if (typeof item != 'undefined') {

            var offset = $(item).offset();
            if (offset) {
                $('html, body').animate({
                    scrollTop: offset.top - $('.mobile.ui-header').height()
                }, 300);
            }
        }
    },
    windowResizing: function () {

        if (this.winResizeTO)
            clearTimeout(this.winResizeTO);
        this.winResizeTO = setTimeout(function () {
            App.windowResized()
        }, 240);
    },
    windowResized: function (force) {

        var oldWidth = App.window.width;

        //Get new size
        App.getWindowSize();


        App.view = App.window.width >= S.desktopViewMinWidth ? 'desktop' : 'mobile';
        $('body').removeClass('desktop mobile').addClass(App.view);

        if ('mobile' == App.view) {

            App.$.slideShow.css({
                'height': App.$.slideShow.width() / S.slideShowRatio,
            });


            App.$.m_navigation.listview('refresh');
            App.scrollToCategory(App.$.m_navigation.find('.open'));

        } else {

            //If all listview's are closed then open first one for desktop mode
            if (App.$.m_navigation.find('.open').length == 0)
                App.$.m_navigation.find('li:first').collapsible("expand");

            //Fix cart page to right panel :-)
            $.id('cart').attr('class', 'rightpan').removeAttr('style');

            if (App.currentPage == 'cart') {
                $.mobile.navigate("#home");
                //$(":mobile-pagecontainer").pagecontainer("change", "#home");
            }

            App.$.slideShow.css({
                'height': App.$.slideShow.width() / S.slideShowRatio,
            });
        }

        App.slideShowWidth = App.$.theSlideshow.width();

        //if (oldWidth != App.window.width || force === true) {
        //if (App.view == 'desktop' || force === true) {
        console.log('yyy');
        var slideItems = App.$.slideShow.children('.item').length;

        App.$.slideShow.css('width', slideItems * App.slideShowWidth)
                .add(App.$.productPage.find('.product-image')).css({
                    'height': App.slideShowWidth / S.slideShowRatio
                });


        App.$.slideShow.children('.item').css({
            'width': App.slideShowWidth

        }).find('img').css('max-width', App.slideShowWidth);


        App['currentSlide'] = 0;
        TweenLite.to(App.$.slideShow, 0, { x: 0, y: 0, z: 0 });

        App.$.m_navigation.listview('refresh');
        App.scrollTo(App.$.m_navigation.find('.open'));
        //}

        log('resize end, type: ' + App.view + ' and width: ' + App.window.width + ' and height: ' + App.window.height);
        //App.$.overlay.fadeOut(360);
    },
    getWindowSize: function () {

        return App.window = {
            width: window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth,
            height: window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight
        }
    },
    animateFromTo: function (startTag, endTag) {

        var dfd = jQuery.Deferred();
        var image = $(startTag).find('img.productImage');
        if (image.length === 0)
            image = $(startTag).find('.ui-li-count');

        var imagePos = image.offset();
        var imageClone = image.clone();
        //var target = App.view == 'mobile' ? $.id('cartBTN') : $('#shoppingCart li:last').prev();

        if (image) {

            imageClone.css({
                //'opacity': 0.8,
                'position': 'absolute',
                'top': imagePos.top,
                'left': imagePos.left,
                'height': image.height(),
                'width': image.width(),
                'z-index': '9000'
            })

                    //Add class for jq remove function
                    .addClass('animation-image-clone')

                    //Add clone to dom
                    .appendTo($('body'))

                    //Step 1
                    .animate({
                        //'top': [endTag.offset().top + 60, 'cos'],
                        'top': endTag.offset().top + 60,
                        //'left': [endTag.offset().left - 40, 'sin'],
                        'left': endTag.offset().left - 40,
                    }, 300)

                    //Step 2
                    .animate(
                            {
                                //'top': [endTag.offset().top + 10, 'cos'],
                                'top': endTag.offset().top + 10,
                                //'left': [endTag.offset().left + 10, 'sin'],
                                'left': endTag.offset().left + 10,
                                'width': 0, //endTag.height(),
                                'height': 0//endTag.height()
                            }, 150,
                            function () {

                                //Remove cloned image
                                $('.animation-image-clone').remove();

                                endTag.effect(
                                        "shake",
                                        {
                                            times: 2,
                                            distance: 10
                                        },
                                200
                                        );

                                //All clear
                                dfd.resolve();
                            }
                    )

            //No image just skip animation
        } else {
            dfd.resolve();
        }

        return dfd.promise();
    },


    validate: function () {

        var isValid = true;
        var vids = [
			'FirstName',
			'ShippingMethodId',
			'DeliveryDelay',
			'PaymentMethodId',
			'Phone'
        ];


        if (App.shipping === '1') {
            vids = vids.concat([
				'Zip',
				'Housenumber',
				'street',
				'city'
            ]);
        }

        $.each(vids, function () {

            var el = '#' + this;
            if ($.trim($(el).val()) == '') {
                var label = $(el).closest('.ui-field-contain').find('label').text();
                App.msg.show(label + ' is verplicht');
                isValid = false;
                return false;
            }
        })

        return isValid;
    },

    version: function () {
        App.msg.show('wo sep 03 14:30:52 2014');
    }
}




/*Store OBJ*/
/*function Store(obj){

 var customStyles = {};

 // Color S
 if(getURLParameter('GradientColorStart1') != undefined)
 customStyles.GradientColorStart1 = hexColor(getURLParameter('GradientColorStart1'));

 // Meny icon
 if(getURLParameter('MenuIconUrl') != undefined)
 customStyles.MenuIconUrl = getURLParameter('MenuIconUrl');

 // Mini cart icon
 if(getURLParameter('MiniCartIconUrl') != undefined)
 customStyles.MiniCartIconUrl = getURLParameter('MiniCartIconUrl');

 //Extend style S from custome parameters
 if(!jQuery.isEmptyObject(customStyles)){
 $.extend(obj.StyleSettings, customStyles);
 }

 // SET ALLOWPREORDER (REMOVE THIS WHEN GOES TO PRODUCTION SERVER)
 if(obj.ALLOWPREORDER == undefined) this.ALLOWPREORDER = true;

 // SET DISCOUNTONTOTALAMOUNT (REMOVE THIS WHEN GOES TO PRODUCTION SERVER)
 if(obj.DISCOUNTONTOTALAMOUNT == undefined) this.DISCOUNTONTOTALAMOUNT = 0;

 return $.extend(obj, this);
 };*/


var Customer = {
    getInput: function () {

        App['customer'] = {
            Address: $.trim($.id('street').val()),
            City: $.trim($.id('city').val()),
            Housenumber: $.trim($.id('Housenumber').val()),
            LastName: $.trim($.id('FirstName').val()),
            EmailAddress: $.trim($.id('EmailAddress').val()),
            OrderNotes: $.trim($.id('OrderNotes').val()),
            Phone: $.trim($.id('Phone').val()),
            Zip: $.trim($.id('Zip').val())
        }

        return App.customer;
    },
    saveInput: function () {

        App['customer'] = {
            Address: $.trim($.id('street').val()),
            City: $.trim($.id('city').val()),
            Housenumber: $.trim($.id('Housenumber').val()),
            LastName: $.trim($.id('FirstName').val()),
            EmailAddress: $.trim($.id('EmailAddress').val()),
            OrderNotes: $.trim($.id('OrderNotes').val()),
            Phone: $.trim($.id('Phone').val()),
            Zip: $.trim($.id('Zip').val())
        }

        $.cookie('customer', JSON.stringify(App.customer), { expires: 30, path: '/' });
    },
    loadInput: function () {

        App['customer'] = $.cookie('customer') ? JSON.parse($.cookie('customer')) : {};

        if (!$.isEmptyObject(App.customer)) {

            $.id('street').val(App.customer.Address),
                    $.id('city').val(App.customer.City),
                    $.id('Housenumber').val(''), //$.id('Housenumber').val(App.customer.Housenumber),
                    $.id('FirstName').val(App.customer.LastName),
                    $.id('EmailAddress').val(App.customer.EmailAddress),
                    $.id('OrderNotes').val(App.customer.OrderNotes),
                    $.id('Phone').val(App.customer.Phone),
                    $.id('Zip').val('');//$.id('Zip').val(App.customer.Zip);
        }
    }
};

/*Order (OBJ)*/
function Order(products) {

    this.PaymentMethodId = $.trim($.id('PaymentMethodId').val()),
            this.ShippingMethodId = $.trim($.id('ShippingMethodId').val()),
            this.DeliveryCosts = App.cart.delivery, //App.delivery.data.cost,
            this.DeliveryDelay = $.trim($.id('DeliveryDelay').val()),
            this.Gender = 'NVT',
            this.CompanyName = 'NVT',
            this.MobielNr = 'NVT',
            this.PaymentStatus = 'PENDING',
            this.Platform = S.platform,
            this.PlatformVersion = 'v1.0',
            this.FirstName = " ",
            this.HousenumberAddition = '',
            this.CustomerPaymentPreference = App.paymentID == 2 ? $.trim($.id('moneyBills').val()) : '0',
            this.DeviceRegistrationId = getURLParameter('deviceID') || '0',
            this.StoreId = App.storeId,
            this.Orderlines = products;

    if (App.paymentID == 2)
        this.Issuer = $.trim($.id('issuers').val());

    return this;
}



function moneyBills(sum) {

    var that = {};
    that.first = true, that.bills = [], that.money = [1, 2, 5, 10, 20, 50, 100];

    //Last bill
    that.lastBill = function () {
        return that.bills[that.bills.length - 1].value
    };

    that.bills.push({ value: sum, name: 'Betaal gepast (' + App.intToPrice(sum) + ')' });
    //that.bills.push({value:sum, name:App.intToPrice(sum)});

    //Rounded to bigger value
    that.sum_b = Math.ceil(sum);
    if (that.sum_b > sum)
        that.bills.push({ value: that.sum_b, name: App.intToPrice(that.sum_b) });


    that.sum_s = Math.floor(sum / 10) * 10;

    if (sum != that.sum_s) {
        if ((that.sum_s + 5) > that.lastBill())
            that.bills.push({ value: that.sum_s + 5, name: App.intToPrice(that.sum_s + 5) });
        if ((that.sum_s + 10) > that.lastBill())
            that.bills.push({ value: that.sum_s + 10, name: App.intToPrice(that.sum_s + 10) });
    }


    $.each(that.money, function () {

        if (that.first && this > sum && this > that.lastBill()) {

            that.first = false;
            that.bills.push({ value: this, name: App.intToPrice(this) });

        } else if (this > sum && !that.first) {
            that.bills.push({ value: this, name: App.intToPrice(this) });
        }
    });

    return that.bills;
}


function debug(obj) {

    var text = '';

    $.each(obj, function (prop, val) {
        text += prop + ': ' + val + '<br />';
    });

    return text;
}


function Attribute(a) {


    this.type = a.CONTROLTYPEID,
            this.name = a.DISPLAYTEXT,
            this.isRequired = a.ISREQUIRED,
            this.options = {},
            this.optionsOrder = [];

    //Sort
    a.ProductAttrValues.sortBy('DISPLAYORDER');

    //Loop values to create options
    for (i = 0; i < a.ProductAttrValues.length; i++) {

        var option = a.ProductAttrValues[i];
        var name = option.NAME;
        var longName = option.NAME;

        if (option.PRICEADJUSTMENT > 0)
            longName += ' (+' + App.intToPrice(option.PRICEADJUSTMENT) + ')';

        this.options[a.ProductAttrValues[i].PRODUCTATTRVALID] = {
            price: option.PRICEADJUSTMENT,
            longName: longName,
            name: name,
            DISPLAYORDER: option.DISPLAYORDER
        }

        this.optionsOrder.push(a.ProductAttrValues[i].PRODUCTATTRVALID);
    }

    //$.each(a.ProductAttrValues, function(){})
    return this;
}


/**************HTML TEMPLATES*****************/
var TPL = {
    option: '<option {{selected}} value="{{value}}">{{name}}</option>',
    optionPayment: '<option {{selected}} value="{{value}}">{{name}}</option>',
    img: '<img class="{{class}}" src="{{src}}" alt="{{alt}}" onerror="this.style.display=\'none\'" />',
    imgInList: '<li><img class="{{class}}" src="{{src}}" alt="{{alt}}" onerror="this.style.display=\'none\'" /></li>',
    totalRow: '<li class="{{cssclass}}"><strong>{{title}}</strong> <span class="price">{{price}}</li>',
    attributeItem: '<div class="xSelect">' +
            '<label for="select_{{id}}" class="select">{{title}}</label>' +
            '<select name="{{id}}" id="select_{{id}}" {{selectType}} data-native-menu="{{nativeMenu}}">{{options}}</select>' +
            '</div>',
    productPopupItem: '<form method="post" action="" data-productid="{{productid}}">' +
            '{{attributeItems}}' +
            '<br />' +
            /*'<a href="#" class="add custom-btn ui-btn ui-corner-all ui-shadow btn btn-success">Toevoegen aan Winkelwagen</a>'+
             '<a href="#" data-rel="back" class="ui-btn ui-corner-all ui-shadow ui-btn-a">'+
             'Annuleren / Sluiten'+
             '</a>'+*/
            '</form>',
    /*radioBTN: ''+
     '<input type="radio" name="{{name}}" id="radio-{{name}}-{{index}}" value="{{value}}" {{checked}}>'+
     '<label for="radio-{{name}}-{{index}}">{{text}}</label>'+
     '',*/

    cartProduct: '<li class="product" data-id="{{id}}" data-index="{{i}}">' +
            '<input type="number" value="{{qnt}}" />' +
            '<span class="text"> x {{name}}</span>' +
            '<span class="price" onclick="App.removeFromCart({{id}}, {{i}});">' +
            '{{price}}' +
            '</span>' +
            '{{attribs}}' +
            '</li>',
    /*cartProduct: '<li class="product" data-id="{{id}}" data-index="{{i}}">'+
     '<b class="btn-custom btn-edit-product"><img src="/theme/UI/mobile/images/btnRemoveFromCart.png" /></b>'+
     '<span class="text">{{qnt}} x {{name}}</span>'+

     '<span class="price">'+
     '{{price}}'+
     '</span>'+

     '<select>'+
     '<option></option>'+
     '<option value="+">+ 1</option>'+
     '<option value="-">- 1</option>'+
     '<option value="del">Verwijder</option>'+
     '</select>'+

     '{{attribs}}'+
     '</li>',*/

    cartAttributeItem: '<small>-{{name}}: {{option}}</small>',
    link: '<a href="{{url}}">{{text}}</a>'
};
