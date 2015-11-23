$(function(){

    //Page Create
    $(document).on("pagecreate", function(event){

	App['previousPage'] = App.currentPage;
	log('Creating page: ' + App.currentPage);

    });

    $(document).on("mobileinit", function(){
	App.msg.checkQuery();
    });

    /*$("[data-role='header']").toolbar();*/
    //$("#header").toolbar();
    $('#popup').enhanceWithin().popup({afterclose: App.msg.checkQuery});
    $('#plainPopup').enhanceWithin().popup();
    $('#quickmenu').enhanceWithin().popup();
    //$("body>[data-role='panel']").panel();   


    $(document).on('pagecontainerbeforeshow', function(){

	App['currentPage'] = $.mobile.activePage.attr("id");
	log('showing page: ' + App.currentPage);
    });


    $(document).on("pagebeforehide", function(e){
	//console.log(e);

    });

    //Set current page on page load
    $(document).on('pageshow', function(){


	//Check for online payment status
	if(App.paymentStatus){

	    var text;

	    switch (App.paymentStatus){

		case 'SUCCESS':

		    text = '<h2 class="iconed ui-icon-check ui-btn-icon-left">Bedankt voor u bestelling</h2><br />';
		    App.removeFromCart('all');

		    break;

		case 'CANCELLED':
		    text = '<h4 class="iconed ui-icon-forbidden ui-btn-icon-left">Helaas is uw betaling niet verwerkten uw bestelling is niet afgerond</h4><br />';
		    break;

		default:
		    text = '<h4 class="iconed ui-icon-alert ui-btn-icon-left">Er is een onverwachte fout opgetreden, u wordt vriendelijk verzocht om later nogmaals te proberen</h4><br />';
	    }

	    App.$.popup.children('.ui-content').html(
		    text +
		    '<a href="#home" class="ui-btn ui-corner-all ui-shadow ui-btn-a">OK</a>'
		    );

	    App.$.popup.popup("open", {
		positionTo: "window",
		transition: "pop"
	    });

	    App['paymentStatus'] = false;
	}

	//Do Add to cart function (when app goes from product page to home page)
	if('home' === App.currentPage && App.penndingProduct){

	    App.addToCart(App.penndingProduct.productid, App.penndingProduct.attributes), App['penndingProduct'] = false;

	}else if('orderform' === App.currentPage || 'cart' === App.currentPage){

	    if('orderform' !== App.previousPage)
		App.$.shippingMethods.change();

	}else if('callmeback' === App.currentPage){

	    $.id('phonecallmeback').focus();

	}else if('product' === App.currentPage){
	    App.$.productPage.css('display', '');
	}
	
	if(App.view === 'desktop' && App.currentPage != 'home'){
	    $('html, body').animate({
		scrollTop: App.$.slogan.get(0).offsetTop
	    }, 300);
	}
    });


    $.fn.xSelect = function(){

	return this.each(function(){

	    that = $(this);

	    $(this).prev().on(S.click, function(){

		that.children().each(function(){

		    //App.$.xDialog
		})

		App.$.xDialog.show();

		//TPL.xSelectDialog
		App.msg.show('clicked');
	    })

	    //console.warn(this);
	    // Do something to each element here.
	});

    };

    $.widget("custom.fullselectmenu", $.mobile.selectmenu, {
	initSelector: 'select.fullselectmenu',
	_decideFormat: function(){

	    var
		    self = this,
		    $window = this.window,
		    scrollTop = $window.scrollTop(),
		    btnOffset = self.button.offset().top,
		    screenHeight = $window.height();
	    //console.log(self.menuPage);

	    App.$.productPage.css('display', 'block');
	    self.menuPage.appendTo($.mobile.pageContainer).page();
	    self.menuPage.addClass('attribute');
	    self.menuPageContent = self.menuPage.find(".ui-content");
	    self.menuPage.find(".ui-header a").addClass('btn-custom').prepend('<img src="/theme/UI/mobile/images/close.png"/>');
	    self.menuPageClose = self.menuPage.find(".ui-header a");
	    self.thisPage.unbind("pagehide.remove");

	    $('#removeThis').remove();
	    self.menuPage.find(".ui-content").after('<a href="#" id="removeThis" data-role="none" data-rel="back" class="ui-btn ok btn-custom">Selecteer</a>');

	    if(scrollTop === 0 && btnOffset > screenHeight){
		self.thisPage.one("pagehide", function(){
		    $(this).jqmData("lastScroll", btnOffset);
		});
	    }

	    self.menuPage.one({
		pageshow: $.proxy(this, "_focusMenuItem"),
		pagehide: $.proxy(this, "close")
	    });

	    self.menuType = "page";
	    self.menuPageContent.append(self.list);
	    self.menuPage.find("div .ui-title").text(self.label.text());
	    /*
	     //App.msg.show('hmmm');
	     self.menuType = "overlay";
	     self.listbox.one( { popupafteropen: $.proxy( this, "_focusMenuItem" ) } );*/
	}
    });




});