var raptorPubsub = require('raptor-pubsub');

var nextId = 0;

module.exports = {
  onInput (input) {
    this.state = {
      notifications: input.notifications || []
    };
  },

  onMount () {
    var self = this;

    this.subscribeTo(raptorPubsub)
      .on('notification', function (eventArgs) {
        var message = eventArgs.message;
        self.addNotification(message);
      });
  },

  addNotification (message) {
    var notifications = this.state.notifications;
    var notificationId = 'notification' + (nextId++);
    notifications = [
      {
        message: message,
        id: notificationId
      }
    ].concat(notifications);

    this.setState('notifications', notifications);

    setTimeout(() => {
      this.removeNotification(notificationId);
    }, 3000);
  },

  removeNotification (notificationId) {
    var notificationWidget = this.getComponent(notificationId);
    notificationWidget.fadeOut(() => {
      var notifications = this.state.notifications.filter((notification) => {
        return notification.id !== notificationId;
      });
      this.setState('notifications', notifications);
    });
  }
};
