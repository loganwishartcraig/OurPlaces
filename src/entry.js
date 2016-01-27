$(document).ready(function() {

  function removeRequest(elm, request) {
    document.getElementById(elm).removeChild(request);
  }

  // abstract post into promise

  function handleRequestAction(e) {
    if (e.target.tagName === 'BUTTON') {
      switch (e.target.getAttribute('action')) {
        case 'ACCEPT':
          console.log('accpeting request');
          $.post('/user/acceptRequest', {
            friendId: e.target.getAttribute('value')
          }).success(function(msg) {
            console.log(msg);
            removeRequest('friendRequests', e.target.parentElement);
          }).error(function(err) {
            console.log(err);
          });
          break;
        case 'DECLINE':
          $.post('/user/removeRequest', {
            friendId: e.target.getAttribute('value')
          }).success(function(msg) {
            console.log(msg);
            removeRequest('friendRequests', e.target.parentElement);
          }).error(function(err) {
            console.log(err);
          });
          break;
        default:
          console.log('action not found...');
          break;
      }
    }
  }

  function handleFriendAction(e) {

     if (e.target.tagName === 'BUTTON') {
      switch (e.target.getAttribute('action')) {
        case 'DELETE':
          $.post('/user/removeFriend', {
            friendId: e.target.getAttribute('value')
          }).success(function(msg) {
            console.log(msg);
          }).error(function(err) {
            console.log(err);
          });
          break;
        default:
          console.log('action not found...');
          break;
      }
    }

  }

  function handleAddFriendAction(e) {
    e.preventDefault();

    var friendName = document.getElementById('friendToAdd').value;


    if (e.target.tagName === 'BUTTON') {
      switch (e.target.getAttribute('action')) {
        case 'SEND':
          $.post('/user/addRequest', {
            friendId: friendName
          }).success(function(msg) {
            console.log(msg);
          }).error(function(err) {
            console.log(err);
          });
          break;
        default:
          console.log('action not found...');
          break;
      }
    }

  }

  document.getElementById('friendRequests').addEventListener('click', handleRequestAction);
  document.getElementById('friendList').addEventListener('click', handleFriendAction);
  document.getElementById('addFriend').addEventListener('click', handleAddFriendAction);
});
