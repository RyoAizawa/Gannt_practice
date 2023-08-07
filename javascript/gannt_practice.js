// 初期表示時
$(function() {
	
	// CSS関連 - ヘッダー
	const element = document.querySelector('.column_header');
	// 横にスクロールした分、位置をずらす
	element.style.left = -window.pageXOffset + 'px';
	window.addEventListener('scroll', () => {
	  element.style.left = -window.pageXOffset + 'px';
	});
});