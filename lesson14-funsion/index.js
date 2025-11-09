let a = +prompt("enter a number");
function isPrime(number) {
    if (number < 2) return false;
    for (let i = 2; i <= Math.sqrt(number); i++) {
        if (number % i === 0) return false;
    }
    return true;
}
    if (isPrime(a)) {
        alert(`${a} la so nguyen to`);
    }else {alert(`${a} k la so nguyen to`);}
