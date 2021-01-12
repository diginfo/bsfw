;(function($) {

$.fn.cmycombo = function(options, param){
	if (typeof options == 'string'){
		var method = $.fn.combobox.methods[options];
		if (method){
			return method(this, param);
		} else {
			return this.combo(options, param);
		}
	}
	
	options = options || {};
	return this.each(function(){
		var state = $.data(this, 'combobox');
		if (state){
			$.extend(state.options, options);
		} else {
			state = $.data(this, 'combobox', {
				options: $.extend({}, $.fn.combobox.defaults, $.fn.combobox.parseOptions(this), options),
				data: []
			});
		}
		create(this);
		if (state.options.data){
			loadData(this, state.options.data);
		} else {
			var data = $.fn.combobox.parseData(this);
			if (data.length){
				loadData(this, data);
			}
		}
		request(this);
	});
};


$.fn.combobox.methods = {
	
	options: function(jq){
		var copts = jq.combo('options');
		return $.extend($.data(jq[0], 'combobox').options, {
			width: copts.width,
			height: copts.height,
			originalValue: copts.originalValue,
			disabled: copts.disabled,
			readonly: copts.readonly
		});
	},
	
	getData: function(jq){
		return $.data(jq[0], 'combobox').data;
	},
	
	setValues: function(jq, values){
		return jq.each(function(){
			var opts = $(this).combobox('options');
			if ($.isArray(values)){
				values = $.map(values, function(value){
					if (value && typeof value == 'object'){
						$.easyui.addArrayItem(opts.mappingRows, opts.valueField, value);
						return value[opts.valueField];
					} else {
						return value;
					}
				});
			}
			setValues(this, values);
		});
	},
	setValue: function(jq, value){
		return jq.each(function(){
			$(this).combobox('setValues', $.isArray(value)?value:[value]);
		});
	},
	clear: function(jq){
		return jq.each(function(){
			setValues(this, []);
		});
	},
	reset: function(jq){
		return jq.each(function(){
			var opts = $(this).combobox('options');
			if (opts.multiple){
				$(this).combobox('setValues', opts.originalValue);
			} else {
				$(this).combobox('setValue', opts.originalValue);
			}
		});
	},
	loadData: function(jq, data){
		return jq.each(function(){
			loadData(this, data);
		});
	},
	reload: function(jq, url){
		return jq.each(function(){
			if (typeof url == 'string'){
				request(this, url);
			} else {
				if (url){
					var opts = $(this).combobox('options');
					opts.queryParams = url;
				}
				request(this);
			}
		});
	},
	select: function(jq, value){
		return jq.each(function(){
			select(this, value);
		});
	},
	unselect: function(jq, value){
		return jq.each(function(){
			unselect(this, value);
		});
	},
	scrollTo: function(jq, value){
		return jq.each(function(){
			scrollTo(this, value);
		});
	}
};


})(jQuery);