---
layout : main
title : board_image
---

<div id="main" class="wrapper">
    <section>
        <div class="container">
            <div class="table-wrapper">
                <h2>책 정리</h2>
                <table class="alt">
                	<thead>
                		<tr>
                			<th>날짜</th>
                			<th>제목</th>
                			<th>카테고리</th>
                		</tr>
                	</thead>
                	<tbody>
                		{% assign card_posts = site.posts | where_exp: "post", "post.path contains '/post_book/'" | sort: "index" %}
                        {% for post in card_posts %}
                        <tr>
                            <td>{{ post.index }}</td>
                            <td><a href="{{ post.url }}">{{ post.title }}</a></td>
                            <td>{{ post.categories | join: ", " }}</td>
                        </tr>
                        {% endfor %}
                	</tbody>
                	<tfoot>
                		<tr>
                			<td colspan="2"></td>
                			<td></td>
                		</tr>
                	</tfoot>
                </table>
            </div>
        </div>
    </section>
</div>