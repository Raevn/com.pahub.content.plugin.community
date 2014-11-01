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
		addNewsItem: function(news_title, news_text, news_author) { model.news.addNewsItem(news_title, news_text, news_author); },
	}
	
	model["news"] = {
		news_items: ko.observableArray(),
		
		news_loading: ko.observable(false),
		
		show_add: ko.observable(false),
		
		loadNews: function() {
			model.news.news_loading(true);
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
						model.news.news_items.push(newsJSON[i]);
					}
				}
			});
		},
		
		addNewsItem: function(news_title, news_text, news_author) {
			//news_text = news_text.replace(/\"/g,"&quot;"); 
			pahub.api.resource.loadResource("http://pahub.raevn.com/news.php?action=add&title=" + encodeURIComponent(news_title).replace(/\./g, "%01") + "&author=" + encodeURIComponent(news_author).replace(/\./g, "%01") + "&text=" + encodeURIComponent(news_text).replace(/\./g, "%01"), "get", {name: "Submit News Item", mode: "async"});
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