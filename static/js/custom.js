var channelName = 'TechGuyweb'

$(document).ready(function(){
	$.get(
		"GET https://developers.google.com/apis-explorer/#p/youtube/v3/youtube.channels.list?"{
			part: 'contentDetails',
			forUsername: channelName,
			key: 'AIzaSyCWCNcfrCI8X2YSFrRqrmgClHe4mswhdY8'
		},
		function(data){
			$.each(data.items, function(){
				console.log(item)
			})
		}
		)
})