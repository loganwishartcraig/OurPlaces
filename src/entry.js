$(document).ready(function() {


  function formatFriendNames(fqList) {


    var friendNames = [];

    for (var key in fqList) {
      if (fqList.hasOwnProperty(key)) {
        friendNames.push(fqList[key].firstName);
      }
    }
    console.log(friendNames);
    return friendNames;
  }

  function pullFriendRequests() {

    $.get('/user/getFriendRequests').success(function(msg) {
      console.log(msg);
      setFriendRequests('#friendRequests', formatFriendNames(msg));
    }).error(function(msg) {
      console.log(msg);
    });

  }

  function setFriendRequests(elm, data) {
    console.log('setting elm');
    $(elm).html(data);
  }

  pullFriendRequests();

});
