$(document).ready(function() {

  function removeRequest(elm, request) {
    document.getElementById(elm).removeChild(request);
  }

  function handleRequestAction(e) {
    if (e.target.tagName === 'BUTTON') {
      switch (e.target.getAttribute('action')) {
        case 'ACCEPT':
          $.post('/user/acceptRequest', {
            friendId: e.target.getAttribute('value')
          }).success(function(msg) {
            console.log(msg);
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

  document.getElementById('friendRequests').addEventListener('click', handleRequestAction);

});
