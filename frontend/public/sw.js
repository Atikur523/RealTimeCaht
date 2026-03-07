self.addEventListener('push', function (event) {
    const data = event.data.json();
    const { receiverName, senderName, type } = data;

    let alertText = "";
    if (type === "message") {
        alertText = `হ্যালো ${receiverName}, আপনাকে রিয়েল টাইম চ্যাট এপ্লিকেশন থেকে ${senderName} মেসেজ পাঠাচ্ছে।`;
    } else {
        alertText = `হ্যালো ${receiverName}, আপনাকে রিয়েল টাইম চ্যাট এপ্লিকেশন থেকে ${senderName} একটি ${type} কল দিচ্ছে।`;
    }

    self.registration.showNotification('নতুন মেসেজ/কল', {
        body: alertText,
        icon: '/logo192.png',
    });
});

