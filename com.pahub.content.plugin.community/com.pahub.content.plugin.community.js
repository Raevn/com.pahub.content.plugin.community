/** com.pahub.content.plugin.community **/
function load_plugin_community(data, folder) {
	var md = new Remarkable({
		html:         false,        // Enable html tags in source
		xhtmlOut:     false,        // Use '/' to close single tags (<br />)
		breaks:       false,        // Convert '\n' in paragraphs into <br>
		langPrefix:   'language-',  // CSS language prefix for fenced blocks
		linkify:      true,        // Autoconvert url-like texts to links
		typographer:  true,        // Enable smartypants and other sweet transforms

		// Highlighter function. Should return escaped html,
		// or '' if input not changed
		highlight: function (/*str, , lang*/) { return ''; }
	});
	
	setConstant("NEWS_URL", "http://pahub.raevn.com/news.php?action=get");
	
	pahub.api["news"] = {
		addNewsItem: function(news_title, news_text, news_author, news_tags, news_icon) { model.news.addNewsItem(news_title, news_text, news_author, news_tags, news_icon); },
		displayPreview: function(news_title, news_text, news_author, news_tags, news_icon) { model.news.displayPreview(news_title, news_text, news_author, news_tags, news_icon); },
		setFilter: function(tag) { model.news.setFilter(tag); }
	}
	
	model["news"] = {
		folder_path: ko.observable(folder),
		news_items: ko.observableArray(),
		news_preview: ko.observable(),
		news_loading: ko.observable(false),
		show_submit_message: ko.observable(false),
		filter_value: ko.observable(""),
		filter_text: ko.computed({
			read: function() {
				if (model.news.filter_value() != "") {
					if (pahub.api.content.contentItemExists(false, model.news.filter_value()) == true) {
						var content = pahub.api.content.getContentItem(false, model.news.filter_value());
						return content.data.display_name;
					}
					if (pahub.api.content.contentItemExists(true, model.news.filter_value()) == true) {
						var content = pahub.api.content.getContentItem(true, model.news.filter_value());
						return content.data.display_name;
					}
					odel.news.filter_value("");
				}
				return model.news.filter_value();
			},
			deferEvaluation: true
		}),
		available_icons: ko.observableArray([
			{
				name: "Content",
				url: "news-content.png"
			},
			{
				name: "General",
				url: "news-item.png"
			},
			{
				name: "PA",
				url: "news-pa.png"
			}
		]),
		
		show_add: ko.observable(false),
		
		setFilter: function(tag) {
			model.news.filter_value(tag);
		},
		
		filteredNews: ko.computed({
			read: function() {
				if (model.news.filter_value() == "") {
					return model.news.news_items();
				} else {
					var filteredItems = [];
					for (var i = 0; i < model.news.news_items().length; i++) {
						var included = false;
						var news_item = model.news.news_items()[i];
						for (var j = 0; j < news_item.tags().length; j++) {
							if (news_item.tags()[j].value == model.news.filter_value()) {
								included = true;
							}
						}
						if (included == true) {
							filteredItems.push(news_item);
						}
					}
					return filteredItems;
				}
			},
			deferEvaluation: true
		}),
		
		loadNews: function() {
			model.news.news_loading(true);
			model.news.show_submit_message(false);
			var id = pahub.api.resource.loadResource(constant.NEWS_URL, "save", {
				name: "PA Community News",
				saveas: "news.json", 
				mode: "async",
				success: function() {
					
					model.news.news_loading(false);
					model.news.news_items.removeAll();
					var newsJSON = readJSONfromFile(path.join(constant.PAHUB_CACHE_DIR, "news.json"));
					for (var i = 0; i < newsJSON.length; i++) {
						newsJSON[i].text = md.render(newsJSON[i].text.replace(/\u0001/g, "."));
						newsJSON[i].title = newsJSON[i].title.replace(/\u0001/g, ".");
						newsJSON[i].icon = path.join(folder, newsJSON[i].icon.replace(/\u0001/g, "."));
											
						newsJSON[i].tags = ko.observableArray(model.news.getTagArray(newsJSON[i].tags));
						model.news.news_items.push(newsJSON[i]);
					}
				}
			});
		},

		validateNewsItem: function(news_title, news_text, news_author, news_tags, news_icon) {
			if (news_title == "") {
				return false;
			}
			if (news_text == "") {
				return false;
			}
			if (news_author == "") {
				return false;
			}
			if (news_icon == "") {
				return false;
			}
			return true;
		},
		
		updateTags: function() {
			for (var i = 0; i < model.news.news_items().length; i++) {
				var news_item = model.news.news_items()[i];
				for (var j = 0; j < news_item.tags().length; j++) {
					var contentOnline = pahub.api.content.getContentItem(false, news_item.tags()[j].value);
					var contentLocal = pahub.api.content.getContentItem(true, news_item.tags()[j].value);
					if (pahub.api.content.contentItemExists(false, news_item.tags()[j].value) == true) {
						news_item.tags.replace(news_item.tags()[j], {
							name: contentOnline.data.display_name,
							value: news_item.tags()[j].value
						});
					}
					if (pahub.api.content.contentItemExists(true, news_item.tags()[j].value) == true) {
						news_item.tags.replace(news_item.tags()[j], {
							name: contentLocal.data.display_name,
							value: news_item.tags()[j].value
						});
					}
				}
			}
		},
		
		getTagArray: function(news_tags) {
			var tagValues = news_tags.split(",");
			var tagArray = [];
			
			for (var i = 0; i < tagValues.length; i++) {
				tagArray.push({
					name: tagValues[i].trim().replace(/\u0001/g, "."),
					value: tagValues[i].trim().replace(/\u0001/g, ".")
				});
				var contentOnline = pahub.api.content.getContentItem(false, tagArray[i].value.replace(/\u0001/g, "."));
				var contentLocal = pahub.api.content.getContentItem(true, tagArray[i].value.replace(/\u0001/g, "."));
				if (pahub.api.content.contentItemExists(false, tagArray[i].value.replace(/\u0001/g, ".")) == true) {
					tagArray[i] = {
						name: contentOnline.data.display_name,
						value: tagArray[i].value.replace(/\u0001/g, ".")
					};
				}
				if (pahub.api.content.contentItemExists(true, tagArray[i].value.replace(/\u0001/g, ".")) == true) {
					tagArray[i] = {
						name: contentLocal.data.display_name,
						value: tagArray[i].value.replace(/\u0001/g, ".")
					};
				}
			}
			return tagArray;
		},
		
		addNewsItem: function(news_title, news_text, news_author, news_tags, news_icon) {
			if (model.news.validateNewsItem(news_title, news_text, news_author, news_tags, news_icon) == true) {
				pahub.api.resource.loadResource("http://pahub.raevn.com/news.php?action=add&title=" + encodeURIComponent(news_title).replace(/\./g, "%01") + "&author=" + encodeURIComponent(news_author).replace(/\./g, "%01") + "&text=" + encodeURIComponent(news_text).replace(/\./g, "%01") + "&tags=" + encodeURIComponent(news_tags).replace(/\./g, "%01") + "&icon=" + encodeURIComponent(news_icon).replace(/\./g, "%01"), "get", {name: "Submit News Item", mode: "async"});
				model.news.show_add(false);
				model.news.show_submit_message(true);
			}
		},
		
		displayPreview: function(news_title, news_text, news_author, news_tags, news_icon) {
			if (model.news.validateNewsItem(news_title, news_text, news_author, news_tags, news_icon) == true) {
				news_text = md.render(news_text.replace(/\u0001/g, "."));
				model.news.news_preview({
					title: news_title,
					author: news_author,
					date: getDateTimeString(new Date()),
					text: news_text,
					tags: ko.observableArray(model.news.getTagArray(news_tags)),
					icon: path.join(model.news.folder_path(), news_icon.replace(/\u0001/g, "."))
				});
			}
		}
	}
	
	model.news.loadNews();
	
	pahub.api.section.addSection("section-community", "COMMUNITY", path.join(folder, "community.png"), "sections", 10);
	pahub.api.tab.addTab("section-community", "news", "NEWS", "", 10);
	pahub.api.tab.addTab("section-community", "chat", "CHAT", "", 20);
	pahub.api.tab.addTab("section-community", "forum", "FORUM", "", 30);
	
	pahub.api.resource.loadResource(path.join(folder, "news.html"), "get", {name: "HTML: news", mode: "async", success: function(resource) {
		pahub.api.tab.setTabContent("section-community", "news", resource.data);
	}});
	pahub.api.tab.setTabContent("section-community", "chat", 
		"<iframe id='iframe-chat' sandbox='none' style='width:100%; height:100%; border:0px'></iframe>"
	);
	pahub.api.tab.setTabContent("section-community", "forum", 
		"<iframe id='iframe-forum' name='disable-x-frame-options' sandbox='none' style='width:100%; height:100%; border:0px'></iframe>"
	);
	
	setTimeout(function() {document.getElementById('iframe-chat').src = 'http://webchat.esper.net/?nick=&channels=planetaryannihilation'}, 1000);
	setTimeout(function() {document.getElementById('iframe-forum').src = 'http://forums.uberent.com'}, 1000);
	
	model.content.getContentItems(false).subscribe(model.news.updateTags);
}

function unload_plugin_community(data) {
	pahub.api.tab.removeTab("section-community", "news");
	pahub.api.tab.removeTab("section-community", "chat");
	pahub.api.tab.removeTab("section-community", "forum");
	pahub.api.section.removeSection("section-community");
	
	delete constant["NEWS_URL"];
	delete pahub.api["news"];
	delete model["news"];
}