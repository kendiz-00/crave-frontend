from pathlib import Path

path = Path(r'c:\Users\ME\Desktop\Crave\index.html')
text = path.read_text(encoding='utf-8')
start = text.find('<div class="col-md-4">')
if start == -1:
    raise SystemExit('start marker not found')
end = text.find('</section>', start)
if end == -1:
    raise SystemExit('end marker not found')
# include closing tag
end += len('</section>')

replacement = '''					<div class="col-md-4">
						<div class="row">
							<div class="col-12">
								<div class="item-ourmenu bo-rad-10 hov-img-zoom pos-relative m-t-30">
									<img src="images/our-story-01.jpg" alt="Jamaican kicten" loading="lazy">
									<div class="btn-menu-wrap">
										<a href="menu.html" class="btn2 flex-c-m txt5 size7">Jamaican kicten</a>
										<a href="order.html?cat=drinks" class="btn2 btn-order flex-c-m txt5 size7">Order Now</a>
									</div>
								</div>
							</div>
							<div class="col-12">
								<div class="item-ourmenu bo-rad-10 hov-img-zoom pos-relative m-t-30">
									<img src="images/chick.jpeg" alt="wraps" loading="lazy">
									<div class="btn-menu-wrap">
										<a href="menu.html" class="btn2 flex-c-m txt5 size8">wraps</a>
										<a href="order.html?cat=starters" class="btn2 btn-order flex-c-m txt5 size8">Order Now</a>
									</div>
								</div>
							</div>
							<div class="col-12">
								<div class="item-ourmenu bo-rad-10 hov-img-zoom pos-relative m-t-30">
									<img src="images/cake.jpg" alt="Dessert" loading="lazy">
									<div class="btn-menu-wrap">
										<a href="menu.html" class="btn2 flex-c-m txt5 size9">Dessert</a>
										<a href="order.html?cat=dessert" class="btn2 btn-order flex-c-m txt5 size9">Order Now</a>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>'''

new_text = text[:start] + replacement + text[end:]
path.write_text(new_text, encoding='utf-8')
print('Replaced malformed menu right column block in index.html')
