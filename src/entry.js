$(document).ready(function() {


  function formatRequests(fqList) {


    var requests = [];

    for (var key in fqList) {
      if (fqList.hasOwnProperty(key)) {

        // replace w/ template html...

        var container = document.createElement('li');

        var fName = document.createElement('span');
        var accept = document.createElement('button');
        var decline = document.createElement('button');

        fName.setAttribute('class', 'request--firstName');
        fName.textContent = fqList[key].firstName;

        accept.setAttribute('type', 'button');
        accept.setAttribute('class', 'request--accept');
        accept.setAttribute('value', key);
        accept.setAttribute('action', 'ACCEPT');
        accept.textContent = 'Accept';

        decline.setAttribute('type', 'button');
        decline.setAttribute('class', 'request--decline');
        decline.setAttribute('value', key);
        decline.setAttribute('action', 'DECLINE');
        decline.textContent = 'Decline';

        container.setAttribute('class', 'request--item');
        container.appendChild(fName);
        container.appendChild(accept);
        container.appendChild(decline);

        requests.push(container);

      }
    }
    return requests;

  }

  function pullFriendRequests() {

    $.get('/user/getFriendRequests').success(function(msg) {

      var formattedRequests = formatRequests(msg);
      console.log(formattedRequests);
      setFriendRequests('friendRequests', formattedRequests);
    }).error(function(msg) {
      console.log(msg);
    });

  }

  function setFriendRequests(elm, data) {

    var container = document.getElementById(elm);
    data.forEach(function(item, index) {
      container.appendChild(item);
    });

  }

  function removeRequest(elm, request) {
    document.getElementById(elm).removeChild(request);
  }

  function handleRequestAction(e) {
    if (e.target.tagName === 'BUTTON') {
      switch (e.target.getAttribute('action')) {
        case 'ACCEPT':
          $.post('/user/addFriend', {
            friendId: e.target.getAttribute('value')
          }).success(function(msg) {
            console.log(msg);
            removeRequest('friendRequests', e.target);
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

  pullFriendRequests();

  document.getElementById('friendRequests').addEventListener('click', handleRequestAction);

});
