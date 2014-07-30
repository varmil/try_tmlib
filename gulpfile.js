var gulp = require('gulp');
var webserver = require('gulp-webserver');

gulp.task('webserver', function() {
	gulp.src('app')
	.pipe(webserver({
		livereload: true,
		directoryListing: true,
		port: 9999,
		fallback: 'index.html'
	}));
});

gulp.task('default', ['webserver']);