<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class News extends Model
{
    protected $fillable = ['title', 'category', 'summary', 'content', 'date', 'image_url'];
}
